import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/supabase';

/**
 * Cria um client Supabase server-side vinculado ao JWT do Clerk do usuário atual.
 *
 * Diferente do client anônimo de `src/server/supabase.js` (usado só para leituras públicas
 * de catálogo), este propaga o token do Clerk para que o RLS (`public.clerk_uid()`) seja
 * aplicado — leituras/escritas ficam escopadas pelo usuário logado, mesmo no servidor.
 *
 * Pré-requisito: Clerk registrado como Third-Party Auth no Supabase (ver docs/SECURITY_RLS.md).
 *
 * @param token JWT da sessão do Clerk, obtido via `const { getToken } = await auth();`.
 */
export function createServerSupabaseClient(token: string | null): SupabaseClient<Database> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    return createClient<Database>(url, anonKey, {
        accessToken: token ? async () => token : undefined,
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
}
