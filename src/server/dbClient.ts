/**
 * Cliente de banco server-side (Neon + Drizzle) — substitui src/server/supabase.ts.
 * Leituras públicas de catálogo e tudo mais passam por aqui; a autorização por
 * usuário é responsabilidade das rotas (Clerk auth()), não do banco (sem RLS).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from '../db/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('⚠️ DATABASE_URL não encontrada — usando fallbacks/mock onde houver.');
}

// neon() exige uma URL válida; placeholder mantém o boot em dev sem banco
// (as chamadas falham graciosamente e os providers caem no fallback/mock).
const sql = neon(connectionString || 'postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder');

export const db = drizzle(sql, { schema });
export { sql };

export const isDbConfigured = (): boolean => Boolean(connectionString);
