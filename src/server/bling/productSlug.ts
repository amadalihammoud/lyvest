/**
 * Decisão de escrita de produto no sync do Bling — pura, sem I/O.
 *
 * Extraída de syncCatalog para poder ser testada: a regra é sutil e o custo de
 * errá-la é alto (produtos que se fundem e trocam de identidade a cada sync).
 *
 * A MESMA regra já existia para categorias (syncCatalog.ts, commit 43b14dc) e
 * nunca foi aplicada a produtos. O ramo de produtos fazia:
 *
 *     const bySlug = ...
 *     if (bySlug[0]) { update(...set blingId = bp.id) }   // adota QUALQUER linha
 *
 * Ou seja: ao encontrar um produto local com o mesmo slug, adotava a linha e
 * SOBRESCREVIA o bling_id dela — mesmo quando essa linha já pertencia a outro
 * produto do Bling. Com "Cueca Boxer" em Masculino e "Cueca Boxer" em Menino,
 * o segundo sobrescrevia o primeiro: um sumia do catálogo e o outro herdava
 * preço, estoque e imagem errados, alternando a cada sincronização.
 */

export type ProductWriteMode =
    /** Já existe linha com este bling_id: atualizar in-place. */
    | 'update'
    /** Existe linha do seed com o mesmo slug e SEM bling_id: adotar. */
    | 'adopt'
    /** Não há correspondência utilizável: inserir linha nova. */
    | 'insert';

export interface ProductWriteDecision {
    mode: ProductWriteMode;
    /** Slug final. Só difere do base quando houve colisão real. */
    slug: string;
}

export interface DecideProductWriteInput {
    /** Slug derivado do nome do produto no Bling. */
    baseSlug: string;
    /** Id local encontrado por bling_id, se houver. */
    matchedByBlingId?: string | null;
    /**
     * Linha local encontrada pelo slug. `blingId` nulo significa produto do
     * seed, ainda não vinculado ao ERP — esse pode ser adotado.
     */
    matchedBySlug?: { id: string; blingId: number | null } | null;
    /** Código/SKU do produto no Bling — preferido para desambiguar. */
    codigo?: string | null;
    /** Id do produto no Bling — reserva de desambiguação. */
    blingId: number;
}

export function decideProductWrite({
    baseSlug,
    matchedByBlingId,
    matchedBySlug,
    codigo,
    blingId,
}: DecideProductWriteInput): ProductWriteDecision {
    // 1. Correlação forte: já conhecemos este produto do Bling.
    if (matchedByBlingId) {
        return { mode: 'update', slug: baseSlug };
    }

    // 2. Sem colisão de slug: linha nova, slug limpo.
    if (!matchedBySlug) {
        return { mode: 'insert', slug: baseSlug };
    }

    // 3. Colisão com linha do seed (sem bling_id): adotar é o certo — é o mesmo
    //    produto, cadastrado à mão antes da integração existir.
    if (matchedBySlug.blingId == null) {
        return { mode: 'adopt', slug: baseSlug };
    }

    // 4. Colisão com produto que JÁ pertence a outro item do Bling. Adotar aqui
    //    destruiria o vínculo do outro. Insere linha própria com slug
    //    desambiguado — determinístico, para não gerar slug novo a cada sync.
    const sufixo = codigo?.trim() ? slugifySufixo(codigo) : String(blingId);
    return { mode: 'insert', slug: `${baseSlug}-${sufixo}` };
}

/** Normaliza o código/SKU para uso em URL (o Bling aceita espaço e barra). */
function slugifySufixo(codigo: string): string {
    return codigo
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
