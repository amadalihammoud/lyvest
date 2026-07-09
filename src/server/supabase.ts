import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../types/supabase';

/**
 * Client Supabase server-side ANÔNIMO — usado apenas para LEITURAS PÚBLICAS de catálogo
 * (products/categories, protegidas por RLS de leitura pública). Não carrega o JWT do
 * usuário, então NÃO deve ser usado para dados escopados por usuário: para isso, use
 * `createServerSupabaseClient(token)` de `src/lib/server/supabaseServer.ts`.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ API Supabase: Variáveis de ambiente não encontradas.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: false, // No storage in serverless environment
        },
    }
);

export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabaseAnonKey);
