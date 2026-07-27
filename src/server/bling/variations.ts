/**
 * Interpretação de produtos com grade vindos do Bling — pura, sem I/O.
 *
 * COMO O BLING REPRESENTA GRADE (verificado contra a API real em 27/07/2026,
 * via o modo ?inspect=1 do sync):
 *
 * A LISTAGEM (/produtos?criterio=2) devolve pai e filhos LADO A LADO, como se
 * fossem produtos independentes, e sem nenhum vínculo entre eles:
 *
 *   { id: 16682830009, nome: "Sutiã Renda Comfort",            formato: "V" }  <- pai
 *   { id: 16682834177, nome: "Sutiã Renda Comfort Tamanho:P",  formato: "S" }  <- filho
 *   { id: 16682834182, nome: "Sutiã Renda Comfort Tamanho:M",  formato: "S" }  <- filho
 *
 * Era isso que fazia o sync criar 5 produtos soltos na vitrine em vez de 1 com
 * 4 variantes: nada na listagem diz que os quatro últimos são grade do primeiro.
 *
 * O vínculo só aparece no GET /produtos/{id} do PAI, no campo `variacoes[]`:
 *
 *   variacao: { nome: "Tamanho:P", ordem: 1, produtoPai: { id: 16682830009 } }
 *   estoque:  { saldoVirtualTotal: 5 }
 *
 * `formato` é o discriminador: "V" = tem variações, "S" = simples (ou filho).
 */

export const FORMATO_COM_VARIACAO = 'V';

export interface BlingVariacao {
    id: number;
    nome?: string;
    codigo?: string;
    preco?: number;
    situacao?: string;
    estoque?: { saldoVirtualTotal?: number };
    gtin?: string;
    variacao?: {
        nome?: string;
        ordem?: number;
        produtoPai?: { id?: number };
    };
}

/** O que uma variação vira em `product_variants`. */
export interface VariantDraft {
    blingId: number;
    /** Valor do atributo — "P" de "Tamanho:P". */
    size: string | null;
    sku: string | null;
    ean: string | null;
    stock: number;
    /** null = herda o preço do produto pai. */
    price: string | null;
    active: boolean;
    ordem: number;
}

/** `formato === 'V'` identifica o produto-pai de uma grade. */
export function temVariacoes(formato?: string): boolean {
    return formato === FORMATO_COM_VARIACAO;
}

/**
 * Extrai o VALOR do atributo de um `variacao.nome`.
 *
 * O Bling entrega "Atributo:Valor" — "Tamanho:P", "Cor:Azul". Guardamos só o
 * valor, porque é o que a loja mostra no seletor. Com mais de um atributo o
 * Bling separa por ";" ("Tamanho:P;Cor:Azul"); nesse caso preservamos o texto
 * inteiro em vez de escolher um deles arbitrariamente.
 */
export function parseVariationValue(nome?: string): string | null {
    const bruto = (nome ?? '').trim();
    if (!bruto) return null;

    if (bruto.includes(';')) return bruto;

    const sep = bruto.indexOf(':');
    if (sep === -1) return bruto;

    const valor = bruto.slice(sep + 1).trim();
    return valor || null;
}

/**
 * Converte as `variacoes[]` do detalhe do pai em rascunhos de variante.
 *
 * Ignora entradas sem id — sem ele não há como correlacionar no próximo sync,
 * e uma variante sem correlação viraria duplicata a cada execução.
 */
export function toVariantDrafts(variacoes: BlingVariacao[] | undefined): VariantDraft[] {
    return (variacoes ?? [])
        .filter((v) => Number.isInteger(v?.id) && v.id > 0)
        .map((v, i) => ({
            blingId: v.id,
            size: parseVariationValue(v.variacao?.nome),
            sku: v.codigo?.trim() || null,
            ean: v.gtin?.trim() || null,
            stock: Math.max(0, Math.trunc(v.estoque?.saldoVirtualTotal ?? 0)),
            // Só grava preço próprio quando difere do pai; senão herda.
            price: typeof v.preco === 'number' && v.preco > 0 ? String(v.preco) : null,
            active: v.situacao !== 'I',
            ordem: v.variacao?.ordem ?? i + 1,
        }))
        .sort((a, b) => a.ordem - b.ordem);
}

/**
 * Ids que são FILHOS de alguma grade e por isso não podem virar produto próprio.
 *
 * É o conjunto que impede os 4 clones na vitrine.
 */
export function collectVariationIds(detalhesDosPais: Array<{ variacoes?: BlingVariacao[] }>): Set<number> {
    const ids = new Set<number>();
    for (const pai of detalhesDosPais) {
        for (const v of pai.variacoes ?? []) {
            if (Number.isInteger(v?.id) && v.id > 0) ids.add(v.id);
        }
    }
    return ids;
}
