import { logError } from '../../lib/server/logger.js';
import { mockProducts } from '../data/mockProducts.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

/**
 * Busca produtos ativos para contexto do chat
 * @returns {Promise<any[]>}
 */
export async function getProductsForContext(limit = 20) {
    if (!isSupabaseConfigured()) {
        return mockProducts.slice(0, limit);
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                name,
                description,
                price,
                image,
                category:categories(name),
                specs
            `)
            .eq('active', true)
            .limit(limit);

        if (error) {
            logError('products: erro ao buscar produtos para chat', error);
            return [];
        }

        // Simplificar estrutura para o prompt (economizar tokens)
        return data.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category?.name || 'Geral',
            description: p.description,
            image: p.image,
            specs: p.specs
        }));

    } catch (e) {
        logError('products: erro no serviço de produtos (chat)', e);
        return [];
    }
}
