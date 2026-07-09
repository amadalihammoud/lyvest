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

export type RateLimitTier = 'auth' | 'checkout' | 'shipping' | 'coupon' | 'form' | 'ai';

type TierConfig = { limit: number; window: `${number} ${'s' | 'm' | 'h'}` };

// Limites escalonados por sensibilidade da rota.
const TIERS: Record<RateLimitTier, TierConfig> = {
    auth: { limit: 5, window: '5 m' }, // login / reset de senha
    checkout: { limit: 10, window: '1 m' }, // criação de pagamento / checkout
    shipping: { limit: 30, window: '1 m' }, // cálculo de frete (mais permissivo)
    coupon: { limit: 20, window: '1 m' }, // validação de cupom
    form: { limit: 10, window: '1 m' }, // newsletter / contato
    ai: { limit: 8, window: '1 m' }, // rotas que chamam a OpenAI (custo por request)
};

// Só ativa se o Redis estiver realmente configurado (evita quebrar build/dev sem env).
const hasRedis = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
        (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);

// Fail-open barulhento: sem Redis em produção o rate limiting fica DESATIVADO. Não travamos
// o tráfego legítimo (fail-closed causaria auto-DoS), mas gritamos no log para que a
// má-configuração seja detectada em vez de passar silenciosa.
if (!hasRedis && process.env.NODE_ENV === 'production') {
    console.error(
        '[SECURITY] Rate limiting DESATIVADO em produção: UPSTASH_REDIS_REST_URL/TOKEN ausentes. ' +
            'Rotas do Cofre (login, checkout, cupom, IA) estão SEM proteção contra abuso.'
    );
}

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
 *
 * Ordem de confiança: preferimos os headers que a própria plataforma (Vercel) define e que
 * o cliente NÃO consegue forjar (`x-vercel-forwarded-for`, `x-real-ip`) antes de recorrer ao
 * `x-forwarded-for`, cujo primeiro valor é controlável pelo cliente e serve só de último
 * recurso. Isso dificulta a rotação de IP para furar o rate limit por identificador.
 */
export function getClientIp(headers: Headers): string {
    const vercelIp = headers.get('x-vercel-forwarded-for');
    if (vercelIp) return vercelIp.split(',')[0].trim();

    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp.trim();

    const xff = headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();

    return '127.0.0.1';
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
