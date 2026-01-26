// src/utils/__tests__/formatters.test.js
import { describe, it, expect } from 'vitest';
import {
    formatCEP,
    formatPhone,
    formatCPF,
    formatCNPJ,
    formatCardNumber,
    formatExpiry,
    formatCurrency,
    formatDate
} from '../formatters';

describe('Formatters', () => {
    describe('formatCEP', () => {
        it('formats 8 digits into CEP format', () => {
            expect(formatCEP('01310100')).toBe('01310-100');
        });

        it('handles already formatted CEP', () => {
            expect(formatCEP('01310-100')).toBe('01310-100');
        });

        it('handles partial input', () => {
            expect(formatCEP('0131')).toBe('0131');
        });
    });

    describe('formatPhone', () => {
        it('formats 11 digits into phone format', () => {
            expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
        });

        it('handles 10 digit phones', () => {
            const result = formatPhone('1199999999');
            expect(result).toContain('(11)');
        });
    });

    describe('formatCPF', () => {
        it('formats 11 digits into CPF format', () => {
            expect(formatCPF('12345678901')).toBe('123.456.789-01');
        });

        it('handles partial input', () => {
            expect(formatCPF('123')).toBe('123');
        });
    });

    describe('formatCNPJ', () => {
        it('formats 14 digits into CNPJ format', () => {
            expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
        });
    });

    describe('formatCardNumber', () => {
        it('formats 16 digits into card format', () => {
            expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
        });

        it('handles partial input', () => {
            expect(formatCardNumber('4111')).toBe('4111');
        });
    });

    describe('formatExpiry', () => {
        it('formats MMYY into MM/YY', () => {
            expect(formatExpiry('1225')).toBe('12/25');
        });

        it('handles partial input', () => {
            expect(formatExpiry('12')).toBe('12');
        });
    });

    describe('formatCurrency', () => {
        it('formats number to BRL currency', () => {
            const result = formatCurrency(100, 'pt-BR');
            expect(result).toContain('R$');
            expect(result).toContain('100');
        });

        it('formats number to USD currency', () => {
            const result = formatCurrency(100, 'en-US');
            expect(result).toContain('$');
        });

        it('handles decimal values', () => {
            const result = formatCurrency(99.90, 'pt-BR');
            expect(result).toContain('99');
        });
    });

    describe('formatDate', () => {
        it('formats date string', () => {
            const result = formatDate('2026-01-15');
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });
    });
});







