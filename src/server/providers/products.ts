import { eq } from 'drizzle-orm';

import { categories, products } from '../../db/schema';
import { logError } from '../../lib/server/logger';
import { mockProducts } from '../data/mockProducts';
import { db, isDbConfigured } from '../dbClient';

/**
 * Produto simplificado para o contexto do chat (economia de tokens no prompt).
 * `specs` só existe no catálogo mock — o schema real de products não tem essa coluna.
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

/** Busca produtos ativos para o contexto do chat. */
export async function getProductsForContext(limit = 20): Promise<ChatProduct[]> {
    if (!isDbConfigured()) {
        return mockProducts.slice(0, limit).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            description: p.description,
            image: p.image,
            specs: p.specs,
        }));
    }

    try {
        const rows = await db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                price: products.price,
                promotionalPrice: products.promotionalPrice,
                imageUrl: products.imageUrl,
                categoryName: categories.name,
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(eq(products.active, true))
            .limit(limit);

        // Simplifica a estrutura para o prompt. O preço exibido é o efetivo:
        // promotional_price tem prioridade sobre price quando presente.
        return rows.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.promotionalPrice ?? p.price),
            category: p.categoryName ?? 'Geral',
            description: p.description,
            image: p.imageUrl,
        }));
    } catch (e) {
        logError('products: erro no serviço de produtos (chat)', e);
        return [];
    }
}
