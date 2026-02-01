/**
 * Utilitários de Segurança - TypeScript
 * 
 * Sistema robusto de proteção contra ataques comuns
 */

import DOMPurify from 'dompurify';

// Tipos
interface RateLimiterData {
    attempts: number[];
}

interface RateLimitCheck {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

interface HoneypotField {
    fieldName: string;
    validate: (value: string) => boolean;
}

/**
 * Rate limiter baseado em localStorage
 * Protege contra brute force e spam
 */
export class RateLimiter {
    private key: string;
    private maxAttempts: number;
    private windowMs: number;

    constructor(key: string, maxAttempts: number = 5, windowMs: number = 60000) {
        this.key = `rate_limit_${key}`;
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    /**
     * Verifica se a ação está permitida
     */
    check(): RateLimitCheck {
        const now = Date.now();
        const data = this.getData();

        const validAttempts = data.attempts.filter(
            (timestamp) => now - timestamp < this.windowMs
        );

        const allowed = validAttempts.length < this.maxAttempts;
        const remaining = Math.max(0, this.maxAttempts - validAttempts.length);
        const resetIn = validAttempts.length > 0
            ? Math.max(0, this.windowMs - (now - validAttempts[0]))
            : 0;

        return { allowed, remaining, resetIn };
    }

    /**
     * Registra uma tentativa
     */
    attempt(): boolean {
        const { allowed } = this.check();

        if (allowed) {
            const data = this.getData();
            data.attempts.push(Date.now());
            this.saveData(data);
        }

        return allowed;
    }

    /**
     * Reseta o limitador
     */
    reset(): void {
        try {
            localStorage.removeItem(this.key);
        } catch {
            // Falha silenciosa
        }
    }

    private getData(): RateLimiterData {
        try {
            const stored = localStorage.getItem(this.key);
            return stored ? JSON.parse(stored) : { attempts: [] };
        } catch {
            return { attempts: [] };
        }
    }

    private saveData(data: RateLimiterData): void {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch {
            // Falha silenciosa
        }
    }
}

/**
 * Sanitiza HTML usando DOMPurify
 * Remove scripts e código malicioso
 */
export function sanitizeHTML(input: string, allowTags: boolean = false): string {
    if (typeof input !== 'string') return '';

    const config = allowTags
        ? {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
            ALLOWED_ATTR: [],
        }
        : {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true,
        };

    return DOMPurify.sanitize(input, config).trim();
}

/**
 * Sanitiza input para texto puro (remove todas as tags)
 */
export function sanitizeInput(input: string): string {
    return sanitizeHTML(input, false);
}

/**
 * Detecta padrões de XSS em uma string
 */
export function detectXSS(input: string): boolean {
    if (typeof input !== 'string') return false;

    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<\s*img[^>]+onerror/gi,
        /<\s*svg[^>]+onload/gi,
        /expression\s*\(/gi,
        /url\s*\(\s*['"]?\s*data:/gi,
        /vbscript:/gi,
        /data:\s*text\/html/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Gera token CSRF criptograficamente seguro
 */
export function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera nonce para CSP
 */
export function generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

/**
 * Cria campo honeypot para detectar bots
 */
export function createHoneypot(): HoneypotField {
    const fieldNames = ['website', 'url', 'company', 'fax', 'phone2', 'address2'];
    const fieldName = fieldNames[Math.floor(Math.random() * fieldNames.length)];

    return {
        fieldName,
        validate: (value: string) => !value || value.length === 0,
    };
}

/**
 * Escape HTML entities para prevenir XSS
 */
export function escapeHTML(str: string): string {
    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    };

    return String(str).replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char]);
}

/**
 * Valida origem de requisição (CORS)
 */
export function isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false;
    return allowedOrigins.some((allowed) => {
        if (allowed === '*') return true;
        if (allowed.startsWith('*.')) {
            const domain = allowed.slice(2);
            return origin.endsWith(domain);
        }
        return origin === allowed;
    });
}

/**
 * Detecta se requisição parece ser de um bot
 */
export function detectBot(userAgent: string): boolean {
    const botPatterns = [
        /bot/i, /crawl/i, /spider/i, /scrape/i,
        /curl/i, /wget/i, /python/i, /java\//i,
        /headless/i, /phantom/i, /selenium/i,
    ];

    return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Headers de segurança recomendados
 */
export const securityHeaders = {
    'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
};

// Rate limiters pré-configurados
export const loginLimiter = new RateLimiter('login', 5, 300000); // 5 tentativas em 5 min
export const apiLimiter = new RateLimiter('api', 100, 60000);    // 100 requisições por minuto
export const formLimiter = new RateLimiter('form', 10, 60000);   // 10 submissões por minuto

export default {
    RateLimiter,
    sanitizeHTML,
    sanitizeInput,
    detectXSS,
    generateCSRFToken,
    generateNonce,
    createHoneypot,
    escapeHTML,
    isValidOrigin,
    detectBot,
    securityHeaders,
    loginLimiter,
    apiLimiter,
    formLimiter,
};
