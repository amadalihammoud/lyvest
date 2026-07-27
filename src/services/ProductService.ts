// Tipos de produto compartilhados pela aplicação.
// Nota da migração Neon: os métodos ProductService.searchProducts/getProductById/
// getAllProducts nunca eram chamados (só o tipo Product era importado) e falavam
// com o banco direto do browser — foram removidos. Consultas de produto vivem em
// server components / rotas (Drizzle via src/server/dbClient).

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
    colors?: unknown[];
    quantity?: number;
    badge?: string | null;
    rating?: number;
    reviews?: number;
    video?: string;
    oldPrice?: number;
    installments?: { count: number; value: number };
}
