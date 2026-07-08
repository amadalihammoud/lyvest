// src/server/supabaseAdmin.ts
// Client Supabase com service-role — usado EXCLUSIVAMENTE em caminhos server-side de
// escrita/fulfillment que precisam ignorar a RLS (persistir pedido, marcar pago,
// decrementar estoque). NUNCA usar para leitura escopada por usuário (Pilar 3 da skill:
// service_role nunca faz leitura escopada — para isso, RLS + clerk_uid()).
//
// Fail-safe: se SUPABASE_SERVICE_ROLE_KEY não estiver configurada, exporta null e os
// callers fazem no-op (sem quebrar o checkout já existente).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
    supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
              auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

export const isAdminConfigured = (): boolean => supabaseAdmin !== null;
