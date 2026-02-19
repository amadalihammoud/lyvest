// src/utils/__tests__/security.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
    RateLimiter,
    detectXSS,
    createHoneypot,
    generateCSRFToken
} from '../security';
import { isDisposableEmail } from '../validation';

describe('Security Utils', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('RateLimiter', () => {
        it('allows first attempt', () => {
            const limiter = new RateLimiter('test', 5, 60000);
            const { allowed } = limiter.check();
            expect(allowed).toBe(true);
        });

        it('tracks attempts', () => {
            const limiter = new RateLimiter('test2', 5, 60000);

            limiter.attempt();
            limiter.attempt();
            limiter.attempt();

            const { remaining } = limiter.check();
            expect(remaining).toBe(2);
        });

        it('blocks after max attempts', () => {
            const limiter = new RateLimiter('test3', 2, 60000);

            limiter.attempt();
            limiter.attempt();

            const { allowed } = limiter.check();
            expect(allowed).toBe(false);
        });

        it('resets correctly', () => {
            const limiter = new RateLimiter('test4', 2, 60000);

            limiter.attempt();
            limiter.attempt();
            limiter.reset();

            const { allowed } = limiter.check();
            expect(allowed).toBe(true);
        });
    });

    describe('detectXSS', () => {
        it('returns false for normal strings', () => {
            expect(detectXSS('Hello World')).toBe(false);
            expect(detectXSS('user@email.com')).toBe(false);
            expect(detectXSS('My Product Name')).toBe(false);
        });

        it('detects script tags', () => {
            expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
        });

        it('detects javascript: protocol', () => {
            expect(detectXSS('javascript:alert(1)')).toBe(true);
        });

        it('detects event handlers', () => {
            expect(detectXSS('<img onerror="alert(1)">')).toBe(true);
            expect(detectXSS('onclick=steal()')).toBe(true);
        });

        it('detects img onerror', () => {
            expect(detectXSS('<img src=x onerror=alert(1)>')).toBe(true);
        });

        it('returns false for non-strings', () => {
            expect(detectXSS(123)).toBe(false);
            expect(detectXSS(null)).toBe(false);
            expect(detectXSS(undefined)).toBe(false);
        });
    });

    // sanitizeInput tests removed — sanitizeHTML/sanitizeInput moved to sanitize.ts
    // DOMPurify dependency removed from project. If re-added, create sanitize.test.ts.

    describe('isDisposableEmail', () => {
        it('returns true for known disposable domains', () => {
            expect(isDisposableEmail('test@tempmail.com')).toBe(true);
            expect(isDisposableEmail('test@mailinator.com')).toBe(true);
            expect(isDisposableEmail('test@yopmail.com')).toBe(true);
        });

        it('returns false for legitimate domains', () => {
            expect(isDisposableEmail('user@gmail.com')).toBe(false);
            expect(isDisposableEmail('user@outlook.com')).toBe(false);
            expect(isDisposableEmail('user@company.com')).toBe(false);
        });
    });

    describe('createHoneypot', () => {
        it('returns a valid honeypot object', () => {
            const honeypot = createHoneypot();
            expect(honeypot).toHaveProperty('fieldName');
            expect(honeypot).toHaveProperty('validate');
            expect(typeof honeypot.validate).toBe('function');
        });

        it('validate returns true for empty values (not a bot)', () => {
            const honeypot = createHoneypot();
            expect(honeypot.validate('')).toBe(true);
            expect(honeypot.validate(null)).toBe(true);
        });

        it('validate returns false for filled values (likely bot)', () => {
            const honeypot = createHoneypot();
            expect(honeypot.validate('bot-filled-value')).toBe(false);
        });
    });

    describe('generateCSRFToken', () => {
        it('returns a string', () => {
            const token = generateCSRFToken();
            expect(typeof token).toBe('string');
        });

        it('returns a 64 character hex string', () => {
            const token = generateCSRFToken();
            expect(token.length).toBe(64);
            expect(/^[0-9a-f]+$/.test(token)).toBe(true);
        });

        it('returns unique tokens', () => {
            const token1 = generateCSRFToken();
            const token2 = generateCSRFToken();
            expect(token1).not.toBe(token2);
        });
    });
});







