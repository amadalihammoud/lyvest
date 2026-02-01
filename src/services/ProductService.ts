import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Define the Product interface matching our application usage and DB structure
export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category?: {
        name: string;
        slug: string;
    } | { name: string; slug: string; }[] | string; // Handle both expanded and flat category
    specs?: Record<string, string | number | undefined>;
    ean?: string;
    active?: boolean;
    stock_quantity?: number;
    sizes?: string[];
    colors?: any[]; // Allow strings or objects {name, hex}
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
            console.warn('ProductService: Supabase not configured, returning empty search.');
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
            return data as Product[];
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
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Product;
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
                    id,
                    name,
                    description,
                    price,
                    image,
                    category:categories(name, slug),
                    specs
                `)
                .eq('active', true)
                .limit(limit);

            if (error) throw error;
            return data as Product[];
        } catch (error) {
            console.error('ProductService getAll error:', error);
            return [];
        }
    }
};
