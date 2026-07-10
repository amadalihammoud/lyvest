import { logError } from '../../lib/server/logger';
import { mockProducts } from '../data/mockProducts';
import { supabase, isSupabaseConfigured } from '../supabase';

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

/** Linha retornada pelo select abaixo (a categoria vem via join). */
interface ProductRow {
    id: string;
    name: string;
    description: string | null;
    price: number;
    promotional_price: number | null;
    image_url: string | null;
    category: { name: string } | Array<{ name: string }> | null;
}

/** Busca produtos ativos para o contexto do chat. */
export async function getProductsForContext(limit = 20): Promise<ChatProduct[]> {
    if (!isSupabaseConfigured()) {
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
        // Correção do bug latente da versão .js: o select antigo pedia `image` e `specs`,
        // colunas que NÃO existem no schema (é `image_url`; specs não existe) — em produção
        // a query inteira falhava. Também não selecionava `id`, que era usado no map.
        const { data, error } = await supabase
            .from('products')
            .select('id, name, description, price, promotional_price, image_url, category:categories(name)')
            .eq('active', true)
            .limit(limit);

        if (error) {
            logError('products: erro ao buscar produtos para chat', error);
            return [];
        }

        const rows = (data ?? []) as unknown as ProductRow[];

        // Simplifica a estrutura para o prompt (economizar tokens). O preço exibido é o
        // efetivo: promotional_price tem prioridade sobre price quando presente.
        return rows.map((p) => {
            const category = Array.isArray(p.category) ? p.category[0] : p.category;
            return {
                id: p.id,
                name: p.name,
                price: Number(p.promotional_price ?? p.price),
                category: category?.name ?? 'Geral',
                description: p.description,
                image: p.image_url,
            };
        });
    } catch (e) {
        logError('products: erro no serviço de produtos (chat)', e);
        return [];
    }
}
