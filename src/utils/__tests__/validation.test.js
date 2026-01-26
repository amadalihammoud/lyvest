// src/utils/__tests__/validation.test.js
import { describe, it, expect } from 'vitest';
import {
    validateEmail,
    validateCEP,
    validatePhone,
    validateCardNumber,
    validateCVV,
    validateExpiry,
    validateName,
    sanitizeString
} from '../validation';

describe('Validation Utils', () => {
    describe('validateEmail', () => {
        it('accepts valid emails', () => {
            expect(validateEmail('user@example.com').success).toBe(true);
            expect(validateEmail('test.user@domain.co').success).toBe(true);
        });

        it('rejects invalid emails', () => {
            expect(validateEmail('invalid').success).toBe(false);
            expect(validateEmail('no@domain').success).toBe(false);
            expect(validateEmail('@nodomain.com').success).toBe(false);
        });

        it('rejects empty emails', () => {
            expect(validateEmail('').success).toBe(false);
        });
    });

    describe('validateCEP', () => {
        it('accepts valid CEP formats', () => {
            expect(validateCEP('01310-100').success).toBe(true);
            expect(validateCEP('01310100').success).toBe(true);
        });

        it('rejects invalid CEPs', () => {
            expect(validateCEP('123').success).toBe(false);
            expect(validateCEP('abcdefgh').success).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('accepts valid phone formats', () => {
            expect(validatePhone('(11) 99999-9999').success).toBe(true);
            expect(validatePhone('11999999999').success).toBe(true);
        });

        it('rejects invalid phones', () => {
            expect(validatePhone('123').success).toBe(false);
            expect(validatePhone('abcdefghij').success).toBe(false);
        });
    });

    describe('validateCardNumber', () => {
        it('accepts valid card numbers (Luhn algorithm)', () => {
            // Visa test card
            expect(validateCardNumber('4111111111111111').success).toBe(true);
            // Mastercard test card
            expect(validateCardNumber('5500000000000004').success).toBe(true);
        });

        it('rejects invalid card numbers', () => {
            expect(validateCardNumber('1234567890123456').success).toBe(false);
            expect(validateCardNumber('invalid').success).toBe(false);
        });

        it('accepts formatted card numbers', () => {
            expect(validateCardNumber('4111 1111 1111 1111').success).toBe(true);
        });
    });

    describe('validateCVV', () => {
        it('accepts valid 3-digit CVV', () => {
            expect(validateCVV('123').success).toBe(true);
            expect(validateCVV('999').success).toBe(true);
        });

        it('accepts valid 4-digit CVV (Amex)', () => {
            expect(validateCVV('1234').success).toBe(true);
        });

        it('rejects invalid CVVs', () => {
            expect(validateCVV('12').success).toBe(false);
            expect(validateCVV('12345').success).toBe(false);
            expect(validateCVV('abc').success).toBe(false);
        });
    });

    describe('validateExpiry', () => {
        it('accepts valid future expiry dates', () => {
            expect(validateExpiry('12/30').success).toBe(true);
            expect(validateExpiry('01/28').success).toBe(true);
        });

        it('rejects expired dates', () => {
            expect(validateExpiry('01/20').success).toBe(false);
        });

        it('rejects invalid month', () => {
            expect(validateExpiry('13/25').success).toBe(false);
            expect(validateExpiry('00/25').success).toBe(false);
        });

        it('rejects invalid format', () => {
            expect(validateExpiry('invalid').success).toBe(false);
        });
    });

    describe('validateName', () => {
        it('accepts valid names', () => {
            expect(validateName('João Silva').success).toBe(true);
            expect(validateName('Mary Jane').success).toBe(true);
        });

        it('rejects too short names', () => {
            expect(validateName('A').success).toBe(false);
        });

        it('rejects names with invalid characters', () => {
            expect(validateName('<script>').success).toBe(false);
        });
    });

    describe('sanitizeString', () => {
        it('removes dangerous patterns', () => {
            const result = sanitizeString('<script>alert(1)</script>');
            expect(result).not.toContain('<script>');
        });

        it('trims whitespace', () => {
            expect(sanitizeString('  hello  ')).toBe('hello');
        });

        it('returns empty for non-strings', () => {
            expect(sanitizeString(null)).toBe('');
            expect(sanitizeString(undefined)).toBe('');
        });
    });
});







