import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ API Supabase: Variáveis de ambiente não encontradas.');
}

// Client server-side com a anon key (respeita RLS). Para escrita que ignora RLS, use
// src/server/supabaseAdmin.ts (service-role) — nunca esta instância.
export const supabase: SupabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: false, // No storage in serverless environment
        },
    }
);

export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabaseAnonKey);
