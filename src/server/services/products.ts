import { logError } from '../../lib/server/logger';
import { mockProducts } from '../data/mockProducts';
import { supabase, isSupabaseConfigured } from '../supabase';

import type { ProductContext } from './types';

/**
 * Busca produtos ativos para o contexto do chat (ou o mock, sem Supabase configurado).
 */
export async function getProductsForContext(limit = 20): Promise<ProductContext[]> {
    if (!isSupabaseConfigured()) {
        return mockProducts.slice(0, limit) as ProductContext[];
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
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

        // Simplifica a estrutura para o prompt (economiza tokens).
        // Correção surfada pela tipagem: 'id' não era selecionado (vinha undefined) e
        // 'category' é um array do join (o acesso .name direto vinha sempre undefined).
        return (data ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category?.[0]?.name || 'Geral',
            description: p.description,
            image: p.image,
            specs: p.specs,
        }));
    } catch (e) {
        logError('products: erro no serviço de produtos (chat)', e);
        return [];
    }
}
