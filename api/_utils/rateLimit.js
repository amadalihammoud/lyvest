/* global process */
/**
 * Rate limiting distribuído para as funções serverless (api/*.js), via Upstash.
 *
 * Pilar 4 ("Cofre vs. Vitrine"): usar SOMENTE em rotas transacionais (pagamento, frete).
 * NUNCA em GET de catálogo/conteúdo — preservar SEO/GEO e crawlers legítimos.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
const hasRedis = Boolean(REDIS_URL && REDIS_TOKEN)

const redis = hasRedis ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null

// Limites escalonados por sensibilidade.
const TIERS = {
    checkout: { limit: 10, window: '1 m' }, // criação de sessão de pagamento
    shipping: { limit: 30, window: '1 m' }, // cálculo de frete (mais permissivo)
}

const limiters = {}
function getLimiter(tier) {
    if (!redis) return null
    if (!limiters[tier]) {
        const c = TIERS[tier]
        limiters[tier] = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(c.limit, c.window),
            prefix: `rl:${tier}`,
            analytics: false,
        })
    }
    return limiters[tier]
}

export function getClientIp(req) {
    const xff = req.headers['x-forwarded-for']
    if (xff) return String(xff).split(',')[0].trim()
    return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1'
}

/**
 * Aplica o rate limit; se estourar, responde 429 e retorna false.
 * Sem Redis, retorna true (fail-open) para não travar dev/build.
 *
 * Uso: `if (!(await limitOr429(req, res, 'checkout'))) return`
 */
export async function limitOr429(req, res, tier) {
    const limiter = getLimiter(tier)
    if (!limiter) return true
    const { success } = await limiter.limit(getClientIp(req))
    if (!success) {
        res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' })
        return false
    }
    return true
}
