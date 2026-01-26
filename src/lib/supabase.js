// src/lib/supabase.js
// Configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local'
    );
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

// --- INTEGRAÇÃO REAL COM BANCO DE DADOS ---

/**
 * Busca produtos do catálogo (cache do Bling)
 * @returns {Promise<any[]>}
 */
export const getProducts = async () => {
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
    return data;
};

/**
 * Cria um novo pedido no sistema
 * @param {object} orderData 
 */
export const createOrder = async (orderData) => {
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
export const getFinancialRules = async () => {
    if (!isSupabaseConfigured()) return {};

    const { data } = await supabase.from('financial_configs').select('*');
    if (!data) return {};

    // Transforma array em objeto: { 'fee_pix': { percent: 0.99 }, ... }
    return data.reduce((acc, curr) => ({
        ...acc,
        [curr.rule_key]: curr.rule_value
    }), {});
};

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};




