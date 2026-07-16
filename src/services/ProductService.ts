// Tipos de produto compartilhados pela aplicação.
// Nota da migração Neon: os métodos ProductService.searchProducts/getProductById/
// getAllProducts nunca eram chamados (só o tipo Product era importado) e falavam
// com o banco direto do browser — foram removidos. Consultas de produto vivem em
// server components / rotas (Drizzle via src/server/dbClient).

export interface Product {
    id: number | string;
    name: string;
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
