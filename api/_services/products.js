import { supabase, isSupabaseConfigured } from '../_lib/supabase.js';
import { mockProducts } from '../_data/mockProducts.js';

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
            console.error('Erro ao buscar produtos para chat:', error);
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
        console.error('Erro no serviço de produtos (Chat):', e);
        return [];
    }
}
