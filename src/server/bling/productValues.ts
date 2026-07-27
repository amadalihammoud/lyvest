/**
 * Tradução de um produto do Bling para as colunas de `products` — pura, sem I/O.
 *
 * Fica junto de productSlug.ts e variations.ts porque é a mesma família: regra
 * de domínio do Bling que precisa de teste barato. NÃO vai para src/utils/ —
 * nada aqui é compartilhado com o cliente, e src/utils é alcançável pelo bundle
 * do browser.
 */

/** O subconjunto de BlingProduto que interessa para escrever em `products`. */
export interface BlingProdutoFonte {
    nome: string;
    codigo?: string;
    preco?: number;
    precoPromocional?: number | null;
    situacao?: string;
    descricaoCurta?: string;
    imagemURL?: string;
    urlImagem?: string;
    estoque?: { saldoVirtualTotal?: number };
    categoria?: { id: number };
}

export interface BlingProductFields {
    nome: string;
    image: string | null;
    stock: number;
    price: string;
    promo: string | null;
    descricao: string | undefined;
    active: boolean;
}

/**
 * Normaliza os campos crus do Bling. Devolve null quando o produto não tem nome
 * utilizável — sem nome não há o que gravar, e o chamador simplesmente pula.
 *
 * Decisões que não são óbvias:
 *  - `imagemURL || urlImagem`: o Bling usa nomes diferentes conforme o endpoint.
 *  - estoque nunca negativo nem fracionário (o Bling aceita saldo quebrado).
 *  - promoção só vale se for MAIOR QUE ZERO. Uma promoção "0.00" tratada como
 *    válida cobraria R$ 0 pelo produto — foi um bug real, ver src/server/pricing.ts.
 */
export function mapBlingProductFields(bp: BlingProdutoFonte): BlingProductFields | null {
    const nome = (bp.nome ?? '').trim();
    if (!nome) return null;

    return {
        nome,
        image: bp.imagemURL || bp.urlImagem || null,
        stock: Math.max(0, Math.trunc(bp.estoque?.saldoVirtualTotal ?? 0)),
        price: String(bp.preco ?? 0),
        promo: bp.precoPromocional != null && bp.precoPromocional > 0 ? String(bp.precoPromocional) : null,
        descricao: bp.descricaoCurta ?? undefined,
        active: bp.situacao !== 'I',
    };
}

/** Categoria do Bling → id local. null quando não há categoria ou ela não foi sincronizada. */
export function resolveLocalCategoryId(
    catIdMap: Map<number, string>,
    categoria?: { id: number }
): string | null {
    return categoria?.id ? catIdMap.get(categoria.id) ?? null : null;
}

export interface ProductValues {
    name: string;
    description?: string;
    price: string;
    promotionalPrice: string | null;
    active: boolean;
    imageUrl?: string;
    categoryId?: string;
}

/**
 * O payload comum a insert e update.
 *
 * `imageUrl` e `categoryId` entram por spread condicional de propósito: ausentes
 * do objeto, o Drizzle não os inclui no UPDATE. Passá-los como null apagaria a
 * imagem local sempre que o Bling não trouxesse uma — o dado local é melhor que
 * nenhum dado.
 */
export function buildProductValues(fields: BlingProductFields, categoryId: string | null): ProductValues {
    return {
        name: fields.nome,
        description: fields.descricao,
        price: fields.price,
        promotionalPrice: fields.promo,
        active: fields.active,
        ...(fields.image ? { imageUrl: fields.image } : {}),
        ...(categoryId ? { categoryId } : {}),
    };
}

/** Linha achada por slug, no formato que decideProductWrite espera. */
export function toSlugMatch(
    row?: { id: string; blingId: number | null } | undefined
): { id: string; blingId: number | null } | null {
    return row ? { id: row.id, blingId: row.blingId ?? null } : null;
}

/**
 * Se o saldo do Bling entra ou não no que vai ser escrito.
 *
 * São DOIS eixos independentes, e é fácil trocá-los sem perceber:
 *
 *  - No UPDATE, o que manda é `stockIsAuthoritative`. Enquanto as vendas do site
 *    não chegam ao ERP (hoje não chegam — ver src/lib/server/erpFlags.ts), deixar
 *    o Bling sobrescrever o saldo local apaga as vendas já feitas e causa
 *    overselling. Ter grade é irrelevante aqui.
 *
 *  - No INSERT, o que manda é `hasGrade`. Produto com grade não tem estoque
 *    próprio: o saldo vive nas variantes e o trigger trg_sync_product_stock
 *    recalcula products.stock a partir delas. Gravar um valor aqui seria
 *    sobrescrito pelo trigger — ou pior, sobreviveria como número inventado.
 *    A flag é irrelevante aqui: produto novo não tem venda local a preservar.
 *
 * Errar qualquer um dos dois custa dinheiro, em direções opostas. Por isso os
 * dois moram lado a lado, sob teste, em vez de espalhados em dois ternários.
 */
export function pickStockWriteValues<V extends object>(input: {
    values: V;
    stock: number;
    stockIsAuthoritative: boolean;
    hasGrade: boolean;
}): { updateValues: V | (V & { stock: number }); insertValues: V | (V & { stock: number }) } {
    return {
        updateValues: input.stockIsAuthoritative ? { ...input.values, stock: input.stock } : input.values,
        insertValues: input.hasGrade ? input.values : { ...input.values, stock: input.stock },
    };
}
