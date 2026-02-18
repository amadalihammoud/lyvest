/**
 * Server-side rate limiting using Upstash Redis
 * Replaces client-side localStorage-based rate limiting for API routes
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const hasRedis = Boolean(redisUrl && redisToken);

// Create Redis instance only if credentials are available
const redis = hasRedis
    ? new Redis({
        url: redisUrl!,
        token: redisToken!,
    })
    : null;

/**
 * Creates a rate limiter with sliding window algorithm
 * Falls back to allowing all requests if Redis is not configured
 */
function createRateLimiter(prefix: string, requests: number, windowSizeSeconds: number) {
    if (!redis) {
        // Graceful fallback: allow all requests when Redis is unavailable
        return {
            limit: async (_identifier: string) => ({
                success: true,
                limit: requests,
                remaining: requests - 1,
                reset: Date.now() + windowSizeSeconds * 1000,
            }),
        };
    }

    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, `${windowSizeSeconds} s`),
        prefix: `ratelimit:${prefix}`,
    });
}

// Pre-configured rate limiters for different API routes
export const paymentRateLimiter = createRateLimiter('payment', 5, 60);      // 5 requests per minute
export const shippingRateLimiter = createRateLimiter('shipping', 20, 60);   // 20 requests per minute
export const aiRateLimiter = createRateLimiter('ai', 10, 60);              // 10 requests per minute
export const couponRateLimiter = createRateLimiter('coupon', 10, 60);      // 10 requests per minute
export const generalApiRateLimiter = createRateLimiter('api', 100, 60);    // 100 requests per minute

/**
 * Helper to extract client identifier from request
 * Uses X-Forwarded-For header (set by Vercel/reverse proxy) or falls back to a default
 */
export function getClientIdentifier(req: Request | { headers: Record<string, string | string[] | undefined> }): string {
    if (req instanceof Request) {
        return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    }
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0]?.trim() || 'anonymous';
    }
    return 'anonymous';
}

/**
 * Checks rate limit and returns appropriate response if exceeded
 * Returns null if request is allowed, or a Response object if blocked
 */
export async function checkRateLimit(
    limiter: ReturnType<typeof createRateLimiter>,
    identifier: string
): Promise<{ blocked: boolean; headers: Record<string, string> }> {
    const result = await limiter.limit(identifier);

    const headers: Record<string, string> = {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
    };

    return {
        blocked: !result.success,
        headers,
    };
}
