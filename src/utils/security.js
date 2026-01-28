// src/utils/security.js

import DOMPurify from 'dompurify';

/**
 * Utilitários de segurança para proteção adicional
 */

/**
 * Rate limiter simples baseado em localStorage
 * Limita ações por período de tempo
 */
export class RateLimiter {
    constructor(key, maxAttempts = 5, windowMs = 60000) {
        this.key = `rate_limit_${key}`;
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    /**
     * Verifica se a ação está permitida
     * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
     */
    check() {
        const now = Date.now();
        const data = this._getData();

        // Limpa tentativas antigas
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
     * @returns {boolean} Se a ação foi permitida
     */
    attempt() {
        const { allowed } = this.check();

        if (allowed) {
            const data = this._getData();
            data.attempts.push(Date.now());
            this._saveData(data);
        }

        return allowed;
    }

    /**
     * Reseta o limitador
     */
    reset() {
        localStorage.removeItem(this.key);
    }

    _getData() {
        try {
            const stored = localStorage.getItem(this.key);
            return stored ? JSON.parse(stored) : { attempts: [] };
        } catch {
            return { attempts: [] };
        }
    }

    _saveData(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch {
            // Falha silenciosa
        }
    }
}

/**
 * Detecta tentativas de XSS em strings
 * @param {string} input - String a verificar
 * @returns {boolean} True se detectou padrão suspeito
 */
export function detectXSS(input) {
    if (typeof input !== 'string') return false;

    // Ainda útil para validação rápida antes da sanitização
    const xssPatterns = [
        // eslint-disable-next-line security/detect-unsafe-regex
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<\s*img[^>]+onerror/gi,
        /<\s*svg[^>]+onload/gi,
        /expression\s*\(/gi,
        /url\s*\(\s*['"]?\s*data:/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitiza input utilizando DOMPurify (Padrão Industrial)
 * @param {string} input - String a sanitizar
 * @returns {string} String sanitizada e segura
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // Purificar HTML e remover scripts
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // Remove todas as tags HTML por padrão (texto puro)
        ALLOWED_ATTR: [], // Remove todos os atributos
        KEEP_CONTENT: true // Mantém o texto dentro das tags
    }).trim();
}

/**
 * Gera um campo honeypot para formulários
 * Bots geralmente preenchem todos os campos, incluindo os ocultos
 * @returns {{ fieldName: string, validate: (value: string) => boolean }}
 */
export function createHoneypot() {
    // Nome que parece legítimo para enganar bots
    const fieldNames = ['website', 'url', 'company', 'fax', 'phone2'];
    const fieldName = fieldNames[Math.floor(Math.random() * fieldNames.length)];

    return {
        fieldName,
        // Se o campo estiver preenchido, provavelmente é um bot
        validate: (value) => !value || value.length === 0,
    };
}

/**
 * Verifica se um email parece ser temporário/descartável
 * @param {string} email - Email a verificar
 * @returns {boolean} True se parece ser temporário
 */
export function isDisposableEmail(email) {
    const disposableDomains = [
        'tempmail.com',
        'throwaway.email',
        'guerrillamail.com',
        'mailinator.com',
        '10minutemail.com',
        'temp-mail.org',
        'fakeinbox.com',
        'trashmail.com',
        'yopmail.com',
        'getnada.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
}

/**
 * Gera um token CSRF simples
 * @returns {string} Token CSRF
 */
export function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Headers de segurança recomendados para produção
 * Use em servidor/edge functions
 */
export const securityHeaders = {
    'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
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
};







