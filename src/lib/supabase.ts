
// src/lib/supabase.ts
// Configuração do cliente Supabase com Tipagem Forte (Road to 10/10)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Database } from '../types/supabase';
import { logger } from '../utils/logger';


// Tipo auxiliar para retorno de produtos com categoria
export type ProductWithCategory = Database['public']['Tables']['products']['Row'] & {
    category: {
        name: string;
        slug: string;
    } | null;
};

/**
 * Recupera o JWT da sessão do Clerk no client e o repassa ao Supabase.
 *
 * Este é o elo que faz o RLS funcionar: sem ele, toda query roda como papel `anon`
 * (sem identidade), `public.clerk_uid()` retorna NULL e as policies negam/liberam
 * indevidamente. Com o token, o Postgres enxerga o claim `sub` do Clerk e as policies
 * `USING (public.clerk_uid() = user_id)` passam a isolar os dados por usuário.
 *
 * Pré-requisito de infra: registrar o Clerk como Third-Party Auth provider no painel do
 * Supabase (Authentication → Sign In / Providers → Clerk). Ver docs/SECURITY_RLS.md.
 *
 * Funciona tanto em componentes quanto em stores/contextos (que não podem usar hooks),
 * pois lê o global `window.Clerk`. No servidor (SSR) retorna null — leituras públicas
 * (catálogo) seguem funcionando via papel anon.
 */
const getClerkToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
        return (await window.Clerk?.session?.getToken()) ?? null;
    } catch {
        return null;
    }
};

// Singleton pattern seguro para Client-Side
const createSupabaseClient = (): SupabaseClient<Database> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Retorna um cliente "dummy" em desenvolvimento se faltarem chaves,
        // mas loga o erro para o desenvolvedor (warn para não travar a tela)
        if (typeof window !== 'undefined') {
            logger.warn('⚠️ Supabase URLs/Keys missing! Check your .env setup.');
        }
        // Fallback seguro para não quebrar o app instantaneamente,
        // mas chamadas falharão graciosamente
        return createClient<Database>(
            'https://placeholder.supabase.co',
            'placeholder-key'
        );
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        // O Clerk é a fonte de verdade da sessão. O Supabase recebe o JWT do Clerk a
        // cada requisição via accessToken e NÃO gerencia sessão própria.
        accessToken: getClerkToken,
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
};

// Instância singleton
export const supabase = createSupabaseClient();

// --- INTEGRAÇÃO REAL COM BANCO DE DADOS ---

// Helper para verificar se o Supabase está realmente configurado
export const isSupabaseConfigured = (): boolean => {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

/**
 * Busca produtos do catálogo
 */
export const getProducts = async (): Promise<ProductWithCategory[]> => {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            category:categories(name, slug)
        `)
        .eq('active', true);

    if (error) {
        logger.error('Erro ao buscar produtos:', error);
        return [];
    }

    // O cast é necessário aqui pois o TypeScript não infere automaticamente o Join complexo PERFEITAMENTE
    // mas agora temos um tipo alvo seguro.
    return (data as unknown as ProductWithCategory[]) || [];
};

/**
 * Cria um novo pedido no sistema
 */
export const createOrder = async (orderData: Database['public']['Tables']['orders']['Insert']): Promise<Database['public']['Tables']['orders']['Row'] | null> => {
    if (!isSupabaseConfigured()) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('orders')
        .insert(orderData) // Agora tipado! Se orderData estiver errado, o TS grita.
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

    const { data, error } = await supabase.from('financial_configs').select('*');

    if (error) {
        logger.error('Error fetching financial rules:', error);
        return {};
    }

    if (!data) return {};

    // Transforma array em objeto: { 'fee_pix': 0.99, ... }
    return data.reduce((acc: Record<string, number>, curr) => ({
        ...acc,
        [curr.rule_key]: curr.rule_value
    }), {});
};
