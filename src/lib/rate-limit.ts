// src/lib/rate-limit.ts
// Rate limiting distribuído para rotas transacionais (App Router).
//
// Pilar 4 da skill ecommerce-security ("Cofre vs. Vitrine"): aplicar SOMENTE em rotas
// sensíveis/transacionais (login, checkout, cupom, formulários). NUNCA envolver GET de
// catálogo/conteúdo — isso degradaria SEO/GEO e bloquearia crawlers legítimos.
//
// Reusa o cliente Upstash já configurado em src/services/redis.ts.

import { Ratelimit } from '@upstash/ratelimit';

import { redis } from '../services/redis';

export type RateLimitTier = 'auth' | 'checkout' | 'coupon' | 'form';

type TierConfig = { limit: number; window: `${number} ${'s' | 'm' | 'h'}` };

// Limites escalonados por sensibilidade da rota.
const TIERS: Record<RateLimitTier, TierConfig> = {
    auth: { limit: 5, window: '5 m' }, // login / reset de senha
    checkout: { limit: 10, window: '1 m' }, // criação de pagamento / checkout
    coupon: { limit: 20, window: '1 m' }, // validação de cupom
    form: { limit: 10, window: '1 m' }, // newsletter / contato
};

// Só ativa se o Redis estiver realmente configurado (evita quebrar build/dev sem env).
const hasRedis = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
        (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);

const limiters = new Map<RateLimitTier, Ratelimit>();

function getLimiter(tier: RateLimitTier): Ratelimit | null {
    if (!hasRedis) return null;
    let limiter = limiters.get(tier);
    if (!limiter) {
        const { limit, window } = TIERS[tier];
        limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(limit, window),
            prefix: `rl:${tier}`,
            analytics: false,
        });
        limiters.set(tier, limiter);
    }
    return limiter;
}

/**
 * Extrai o IP do cliente a partir dos headers (Vercel/Next.js).
 */
export function getClientIp(headers: Headers): string {
    const xff = headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return headers.get('x-real-ip') || '127.0.0.1';
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Verifica o rate limit para um identificador (normalmente o IP) num tier.
 * Sem Redis configurado, retorna success=true (fail-open) para não travar dev/build.
 */
export async function checkRateLimit(
    identifier: string,
    tier: RateLimitTier
): Promise<RateLimitResult> {
    const limiter = getLimiter(tier);
    if (!limiter) {
        return { success: true, limit: 0, remaining: 0, reset: 0 };
    }
    const res = await limiter.limit(identifier);
    return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
    };
}
