/**
 * Cliente Bling API v3 — OAuth 2.0 (Authorization Code) + fetch autenticado.
 *
 * Pontos de atenção do Bling v3:
 *  - access_token expira em ~6h; refresh_token é ROTATIVO (cada refresh devolve
 *    um novo refresh_token e invalida o anterior) → tokens vivem na tabela
 *    bling_tokens (linha única), nunca em env var.
 *  - Token endpoint usa HTTP Basic (client_id:client_secret) + form-urlencoded.
 *  - Rate limit: ~3 req/s e 120k/dia → pequeno intervalo entre páginas no sync.
 *
 * Env vars necessárias (Vercel/local):
 *  - BLING_CLIENT_ID / BLING_CLIENT_SECRET  (do aplicativo criado no Bling)
 */
import { eq } from 'drizzle-orm';

import { blingTokens } from '../../db/schema';
import { logError, logInfo } from '../../lib/server/logger';
import { db } from '../dbClient';

const BLING_API = 'https://api.bling.com.br/Api/v3';
const TOKEN_URL = 'https://api.bling.com.br/Api/v3/oauth/token';
export const AUTHORIZE_URL = 'https://api.bling.com.br/Api/v3/oauth/authorize';

function basicAuthHeader(): string {
    const id = process.env.BLING_CLIENT_ID ?? '';
    const secret = process.env.BLING_CLIENT_SECRET ?? '';
    return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

export function isBlingConfigured(): boolean {
    return Boolean(process.env.BLING_CLIENT_ID && process.env.BLING_CLIENT_SECRET);
}

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number; // segundos
}

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: basicAuthHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        body: new URLSearchParams(body).toString(),
        cache: 'no-store',
    });

    const json = (await res.json().catch(() => null)) as TokenResponse | null;
    if (!res.ok || !json?.access_token) {
        throw new Error(`Bling token endpoint ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
    }
    return json;
}

async function saveTokens(t: TokenResponse): Promise<void> {
    // margem de 5 min antes da expiração real
    const expiresAt = new Date(Date.now() + (t.expires_in - 300) * 1000);
    await db
        .insert(blingTokens)
        .values({ id: 1, accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt, updatedAt: new Date() })
        .onConflictDoUpdate({
            target: blingTokens.id,
            set: { accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt, updatedAt: new Date() },
        });
}

/** Troca o authorization_code (callback OAuth) por tokens e persiste. */
export async function exchangeAuthCode(code: string): Promise<void> {
    const t = await requestToken({ grant_type: 'authorization_code', code });
    await saveTokens(t);
    logInfo('bling: autorização concluída, tokens persistidos');
}

/** Devolve um access_token válido, renovando via refresh rotativo se preciso. */
export async function getAccessToken(): Promise<string> {
    const rows = await db.select().from(blingTokens).where(eq(blingTokens.id, 1)).limit(1);
    const row = rows[0];
    if (!row) {
        throw new Error('BLING_NOT_AUTHORIZED: rode o fluxo de autorização (ver HANDOFF_NEON.md)');
    }

    if (row.expiresAt.getTime() > Date.now()) {
        return row.accessToken;
    }

    logInfo('bling: access_token expirado, renovando via refresh_token');
    const t = await requestToken({ grant_type: 'refresh_token', refresh_token: row.refreshToken });
    await saveTokens(t);
    return t.access_token;
}

/** GET autenticado na API v3. path ex.: '/categorias/produtos?pagina=1' */
export async function blingGet<T>(path: string): Promise<T> {
    const token = await getAccessToken();
    const res = await fetch(`${BLING_API}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
    });

    if (res.status === 429) {
        // rate limit: espera 1,2s e tenta uma vez mais
        await new Promise((r) => setTimeout(r, 1200));
        return blingGet<T>(path);
    }

    const json = (await res.json().catch(() => null)) as T | null;
    if (!res.ok || json === null) {
        logError('bling: GET falhou', { path, status: res.status });
        throw new Error(`Bling GET ${path} → ${res.status}`);
    }
    return json;
}

/** URL para o usuário autorizar o app (abrir logado no Bling). */
export function buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.BLING_CLIENT_ID ?? '',
        state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
}
