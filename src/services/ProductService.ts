// Tipos de produto compartilhados pela aplicação.
// Nota da migração Neon: os métodos ProductService.searchProducts/getProductById/
// getAllProducts nunca eram chamados (só o tipo Product era importado) e falavam
// com o banco direto do browser — foram removidos. Consultas de produto vivem em
// server components / rotas (Drizzle via src/server/dbClient).

/**
 * Uma variante comprável de um produto com grade (product_variants).
 *
 * `id` é o que precisa chegar ao servidor no checkout: desde a migração 0006,
 * `create_order` recusa item de produto com variante ativa se `variantId` vier
 * ausente, porque a baixa de estoque acontece na variante, não no produto. O
 * `stock` aqui é por tamanho — `products.stock` é só a soma, mantida por trigger.
 */
export interface ProductVariant {
    id: string;
    /** Valor do atributo: "P", "M". Null em produto sem grade. */
    size: string | null;
    stock: number;
    /** Preço já resolvido (próprio da variante, ou herdado do produto). */
    price: number;
}

export interface Product {
    id: number | string;
    name: string;
    /**
     * Slug canônico, vindo de products.slug — a MESMA coluna que a PDP consulta.
     *
     * Existe porque a UI montava a URL com generateSlug(product.name), enquanto
     * o banco guarda um slug gravado pelo slugify do sync. As duas funções
     * coincidem por acaso hoje, mas o sync NÃO regrava o slug no update: basta
     * o lojista renomear um produto no Bling para a UI passar a gerar um slug
     * novo enquanto o banco mantém o antigo — e todo link vira 404, inclusive os
     * já indexados pelo Google.
     *
     * Opcional apenas para o mock legado (src/data/products.ts), que não tem slug.
     */
    slug?: string;
    description: string;
    price: number;
    image: string;
    category?: {
        name: string;
        slug: string;
    } | { name: string; slug: string; }[] | string;
    specs?: Record<string, string | number | undefined>;
    ean?: string;
    active?: boolean;
    stock_quantity?: number;
    sizes?: string[];
    /**
     * Presente só na PDP (getProductBySlug). Quando existe, é a fonte da verdade
     * do seletor: `sizes` vira derivado dela, e cada tamanho carrega estoque
     * próprio e o `variantId` exigido pelo checkout.
     */
    variants?: ProductVariant[];
    /**
     * true = o produto tem grade, mesmo que `variants` nao esteja carregado.
     *
     * A vitrine (getProducts) nao carrega as variantes — seria uma query por
     * produto por pageview. Mas PRECISA saber que existem: adicionar ao
     * carrinho direto da grade produziria um item sem variantId, e a falha so
     * apareceria no ultimo passo do checkout, como erro opaco.
     */
    hasVariants?: boolean;
    colors?: unknown[];
    quantity?: number;
    badge?: string | null;
    rating?: number;
    reviews?: number;
    video?: string;
    oldPrice?: number;
    installments?: { count: number; value: number };
}
