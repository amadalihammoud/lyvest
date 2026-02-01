// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
    formatCurrency,
    formatDate,
    formatShortDate,
    formatDateTime,
    formatNumber,
    formatPercent,
    formatCEP,
    formatPhone,
    formatDocument,
    formatCardNumber
} from '../utils/formatters';
import { generateSlug } from '../utils/slug';
import { validateForm, loginSchema, addressSchema, paymentSchema } from '../utils/validation';

// Mock security utils to avoid DOMPurify dependency in Node
vi.mock('../utils/security', () => ({
    sanitizeInput: (val: string) => val,
    detectXSS: () => false
}));

describe('Utils Test Suite', () => {

    // --- FORMATTERS ---
    describe('Formatters', () => {
        it('formatCurrency should format BRL correctly', () => {
            expect(formatCurrency(100)).toContain('R$');
            expect(formatCurrency(100)).toContain('100,00');
            expect(formatCurrency(0)).toContain('0,00');
            expect(formatCurrency(NaN)).toContain('0,00');
        });

        it('formatNumber should format with separators', () => {
            expect(formatNumber(1234.56)).toBe('1.234,56');
            expect(formatNumber(1000000)).toBe('1.000.000');
            expect(formatNumber('invalid' as any)).toBe('0');
        });

        it('formatPercent should format percentages', () => {
            expect(formatPercent(0.15)).toBe('15%');
            expect(formatPercent(1)).toBe('100%');
            expect(formatPercent(0.123)).toBe('12,3%');
        });

        it('formatCEP should mask correctly', () => {
            expect(formatCEP('12345678')).toBe('12345-678');
            expect(formatCEP('12345')).toBe('12345');
        });

        it('formatPhone should mask correctly', () => {
            expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
            expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
            expect(formatPhone('11')).toBe('(11');
        });

        it('formatDocument should mask CPF/CNPJ', () => {
            expect(formatDocument('12345678901')).toBe('123.456.789-01'); // CPF
            expect(formatDocument('12345678000199')).toBe('12.345.678/0001-99'); // CNPJ
        });

        it('formatCardNumber should group digits', () => {
            expect(formatCardNumber('1111222233334444')).toBe('1111 2222 3333 4444');
        });
    });

    // --- SLUG ---
    describe('Slug Generator', () => {
        it('should generate url-friendly slugs', () => {
            expect(generateSlug('Olá Mundo!')).toBe('ola-mundo');
            expect(generateSlug('Café & Leite')).toBe('cafe-leite');
            expect(generateSlug('Product 123')).toBe('product-123');
        });
    });

    // --- VALIDATION ---
    describe('Validation', () => {

        describe('Login Schema', () => {
            it('should validate correct login', () => {
                const result = validateForm(loginSchema, { email: 'test@example.com', password: 'password123' });
                expect(result.success).toBe(true);
            });

            it('should reject invalid email', () => {
                const result = validateForm(loginSchema, { email: 'invalid', password: '123' });
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.errors.email).toBeDefined();
                }
            });

            it('should reject short password', () => {
                const result = validateForm(loginSchema, { email: 'a@b.com', password: '123' });
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.errors.password).toBeDefined();
                }
            });
        });

        describe('Payment Schema', () => {
            it('should validate correct card', () => {
                // Mock simple valid data (regex only checks digits)
                const result = validateForm(paymentSchema, {
                    cardNumber: '1234567812345678',
                    cardName: 'JOHN DOE',
                    expiry: '12/30',
                    cvv: '123'
                });
                expect(result.success).toBe(true);
            });

            it('should reject invalid expiry', () => {
                const result = validateForm(paymentSchema, {
                    cardNumber: '1234567812345678',
                    cardName: 'JOHN DOE',
                    expiry: '13/30', // Mês 13 inválido
                    cvv: '123'
                });
                expect(result.success).toBe(false);
            });
        });
    });
});
