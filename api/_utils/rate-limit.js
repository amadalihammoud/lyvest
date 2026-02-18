/**
 * Server-side rate limiting using Upstash Redis
 * Used by Vercel serverless functions in /api/
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

const hasRedis = Boolean(redisUrl && redisToken)

const redis = hasRedis
    ? new Redis({ url: redisUrl, token: redisToken })
    : null

/**
 * Creates a rate limiter with sliding window algorithm
 * Falls back to allowing all requests when Redis is unavailable
 */
export function createRateLimiter(prefix, requests, windowSeconds) {
    if (!redis) {
        return {
            limit: async () => ({
                success: true,
                limit: requests,
                remaining: requests - 1,
                reset: Date.now() + windowSeconds * 1000,
            }),
        }
    }

    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
        prefix: `ratelimit:${prefix}`,
    })
}

// Pre-configured limiters
export const paymentLimiter = createRateLimiter('payment', 5, 60)
export const shippingLimiter = createRateLimiter('shipping', 20, 60)
export const couponLimiter = createRateLimiter('coupon', 10, 60)

/**
 * Extract client IP from Vercel request
 */
export function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0]?.trim() || 'anonymous'
    }
    return req.socket?.remoteAddress || 'anonymous'
}

/**
 * Apply rate limiting to a handler
 * Returns 429 if rate limit exceeded, otherwise calls the handler
 */
export function withRateLimit(limiter) {
    return (handler) => {
        return async (req, res) => {
            const identifier = getClientIP(req)
            const result = await limiter.limit(identifier)

            res.setHeader('X-RateLimit-Limit', String(result.limit))
            res.setHeader('X-RateLimit-Remaining', String(result.remaining))
            res.setHeader('X-RateLimit-Reset', String(result.reset))

            if (!result.success) {
                return res.status(429).json({
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
                })
            }

            return handler(req, res)
        }
    }
}
