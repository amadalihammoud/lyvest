import { Redis } from '@upstash/redis';

// Inicializa o cliente Redis
// Tenta usar as variáveis padrão do Upstash ou as genéricas criadas pela integracao Vercel
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
    console.warn('⚠️ Redis credentials not found. Caching will be disabled.');
}

export const redis = new Redis({
    url: redisUrl || 'https://mock-url.upstash.io', // Fallback para evitar crash no build se faltar var
    token: redisToken || 'mock-token',
});

// Wrapper para fallback seguro
export async function safeRedisGet<T>(key: string): Promise<T | null> {
    try {
        if (!redisUrl || !redisToken) return null;
        return await redis.get(key);
    } catch (error) {
        console.error(`Redis Get Error (${key}):`, error);
        return null;
    }
}

export async function safeRedisSet(key: string, value: any, exSeconds: number = 3600): Promise<void> {
    try {
        if (!redisUrl || !redisToken) return;
        await redis.set(key, value, { ex: exSeconds });
    } catch (error) {
        console.error(`Redis Set Error (${key}):`, error);
    }
}
