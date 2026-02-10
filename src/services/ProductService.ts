[
    {
        "StartLine": 1,
        "EndLine": 1,
        "TargetContent": "import { supabase, isSupabaseConfigured } from '../lib/supabase';",
        "ReplacementContent": "import { supabase, isSupabaseConfigured } from '../lib/supabase';\nimport { logger } from '../utils/logger';",
        "AllowMultiple": false
    },
    {
        "StartLine": 66,
        "EndLine": 66,
        "TargetContent": "            console.error('ProductService search error:', error);",
        "ReplacementContent": "            logger.error('ProductService search error:', error);",
        "AllowMultiple": false
    },
    {
        "StartLine": 99,
        "EndLine": 99,
        "TargetContent": "            console.error('ProductService getById error:', error);",
        "ReplacementContent": "            logger.error('ProductService getById error:', error);",
        "AllowMultiple": false
    },
    {
        "StartLine": 131,
        "EndLine": 131,
        "TargetContent": "            console.error('ProductService getAll error:', error);",
        "ReplacementContent": "            logger.error('ProductService getAll error:', error);",
        "AllowMultiple": false
    }
]

// Define the Product interface matching our application usage and DB structure
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
    colors?: any[];
    quantity?: number;
    badge?: string | null;
    rating?: number;
    reviews?: number;
    video?: string;
    oldPrice?: number;
    installments?: { count: number; value: number };
}

/**
 * Service to handle product data retrieval for RAG (Retrieval-Augmented Generation)
 * and general application usage.
 */
export const ProductService = {

    /**
     * Search products using Postgres Full Text Search or simple ILIKE
     * @param query Search term
     * @returns Promise<Product[]>
     */
    async searchProducts(query: string): Promise<Product[]> {
        if (!isSupabaseConfigured()) {
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories(name, slug)
                `)
                .eq('active', true)
                .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(10);

            if (error) throw error;

            // Map DB fields to App fields
            return (data || []).map((p: any) => ({
                ...p,
                image: p.image_url || p.image || '', // Fallback
                id: p.id,
                category: p.category
            })) as Product[];
        } catch (error) {
            console.error('ProductService search error:', error);
            return [];
        }
    },

    /**
     * Get a single product by ID
     * @param id Product ID
     * @returns Promise<Product | null>
     */
    async getProductById(id: number | string): Promise<Product | null> {
        if (!isSupabaseConfigured()) return null;

        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories(name, slug)
                `)
                .eq('id', String(id))
                .single();

            if (error) throw error;

            const p = data as any;
            return {
                ...p,
                image: p.image_url || p.image || '',
                id: p.id,
                category: p.category
            } as Product;
        } catch (error) {
            console.error('ProductService getById error:', error);
            return null;
        }
    },

    /**
     * Get all active products (limited to 50 for context)
     * Useful for populating initial AI context
     * @returns Promise<Product[]>
     */
    async getAllProducts(limit = 50): Promise<Product[]> {
        if (!isSupabaseConfigured()) return [];

        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories(name, slug)
                `)
                .eq('active', true)
                .limit(limit);

            if (error) throw error;

            return (data || []).map((p: any) => ({
                ...p,
                image: p.image_url || p.image || '',
                id: p.id,
                category: p.category
            })) as Product[];
        } catch (error) {
            console.error('ProductService getAll error:', error);
            return [];
        }
    }
};
