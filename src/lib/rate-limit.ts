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
    ai: { limit: 15, window: '1 m' }, // rotas de IA (OpenAI): caro → restringe abuso de custo
};

// Só ativa se o Redis estiver realmente configurado (evita quebrar build/dev sem env).
const hasRedis = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
        (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);

// F3 da security-review: sem Redis o rate limit é fail-open. Em produção isso é um risco
// silencioso (checkout/login sem proteção) — avisa alto no boot para não passar batido.
if (!hasRedis && process.env.NODE_ENV === 'production') {
    console.error(
        '[rate-limit] ATENÇÃO: UPSTASH_REDIS_REST_URL/TOKEN ausentes em produção — ' +
            'rate limiting DESATIVADO (fail-open) em checkout/login/cupom. Configure o Upstash.'
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
 * Segurança: prioriza x-real-ip, que a Vercel define na borda e o cliente NÃO consegue
 * forjar. O x-forwarded-for é controlável pelo cliente (a entrada mais à esquerda pode
 * ser injetada), então usar o XFF permitiria rotacionar IPs falsos e burlar o rate limit.
 * XFF fica só como fallback fora da Vercel (dev/local).
 */
export function getClientIp(headers: Headers): string {
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
