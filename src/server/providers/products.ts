import { getProducts } from './catalog';

/**
 * Produto simplificado para o contexto do chat (economia de tokens no prompt).
 */
export interface ChatProduct {
    id: string | number;
    name: string;
    price: number;
    category: string;
    description: string | null;
    image: string | null;
    specs?: Record<string, string>;
}

/** Busca produtos ativos para o contexto do chat (reaproveita o provider central do catálogo). */
export async function getProductsForContext(limit = 20): Promise<ChatProduct[]> {
    const items = await getProducts({ limit });
    return items.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: typeof p.category === 'string' ? p.category : p.category?.name ?? 'Geral',
        description: p.description,
        image: p.image,
        specs: p.specs as Record<string, string> | undefined,
    }));
}
