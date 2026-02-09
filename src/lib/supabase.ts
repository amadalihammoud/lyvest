
// src/lib/supabase.ts
// Configuração do cliente Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized client to avoid issues during SSR/pre-render
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (_supabase) return _supabase;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    _supabase = createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder-key',
        {
            auth: {
                autoRefreshToken: true,
                persistSession: typeof window !== 'undefined',
                detectSessionInUrl: typeof window !== 'undefined'
            }
        }
    );

    return _supabase;
}

// Export getter instead of direct client
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabaseClient() as any)[prop];
    }
});

// --- INTEGRAÇÃO REAL COM BANCO DE DADOS ---

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

/**
 * Busca produtos do catálogo (cache do Bling)
 * @returns {Promise<any[]>}
 */
export const getProducts = async (): Promise<any[]> => {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            category:categories(name, slug)
        `)
        .eq('active', true);

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
    }
    return data || [];
};

/**
 * Cria um novo pedido no sistema
 * @param {object} orderData 
 */
export const createOrder = async (orderData: any): Promise<any> => {
    if (!isSupabaseConfigured()) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Busca regras financeiras para cálculo de taxas
 */
export const getFinancialRules = async (): Promise<Record<string, number>> => {
    if (!isSupabaseConfigured()) return {};

    const { data } = await supabase.from('financial_configs').select('*');
    if (!data) return {};

    // Transforma array em objeto: { 'fee_pix': { percent: 0.99 }, ... }
    return data.reduce((acc: Record<string, number>, curr: any) => ({
        ...acc,
        [curr.rule_key]: curr.rule_value
    }), {});
};
