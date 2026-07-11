import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/supabase';

/**
 * Client Supabase ADMIN (service role) — EXCLUSIVO para uso server-side em fluxos
 * server-to-server sem JWT de usuário (ex.: webhook de pagamento marcar pedido pago,
 * gravação de payment_ref na criação da sessão).
 *
 * A chave (SUPABASE_SECRET_KEY, com fallback para o nome legado
 * SUPABASE_SERVICE_ROLE_KEY) BYPASSA o RLS: nunca importar em código de cliente,
 * nunca prefixar com NEXT_PUBLIC_, e usar somente com filtros explícitos.
 *
 * Retorna null quando não configurado — o chamador decide o comportamento
 * (fail-closed com log, nunca fingir sucesso).
 */
let cached: SupabaseClient<Database> | null = null;

export function createAdminSupabaseClient(): SupabaseClient<Database> | null {
    if (typeof window !== 'undefined') {
        throw new Error('supabaseAdmin é server-only — nunca use no cliente.');
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secret) return null;
    if (!cached) {
        cached = createClient<Database>(url, secret, {
            auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        });
    }
    return cached;
}
