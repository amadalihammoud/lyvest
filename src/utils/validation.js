// src/utils/validation.js
import { z } from 'zod';
import { sanitizeInput } from './security';

/**
 * Schemas de validação Zod para formulários da aplicação
 */

// Schema para newsletter
export const newsletterSchema = z.object({
    email: z
        .string()
        .min(1, 'errors.required')
        .email('errors.invalidEmail')
        .max(100, 'errors.emailTooLong')
        .transform((val) => val.toLowerCase().trim()),
    consent: z
        .boolean()
        .refine((val) => val === true, {
            message: 'errors.privacyPolicy',
        }),
});

// Schema para login
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'errors.required')
        .email('errors.invalidEmail')
        .max(100, 'errors.emailTooLong')
        .transform((val) => val.toLowerCase().trim()),
    password: z
        .string()
        .min(6, 'errors.passwordTooShort')
        .max(50, 'errors.passwordTooLong'),
});

// Schema para endereço de checkout
export const addressSchema = z.object({
    name: z
        .string()
        .min(2, 'errors.nameTooShort')
        .max(100, 'errors.nameTooLong')
        .transform((val) => sanitizeString(val)),
    document: z
        .string()
        .min(11, 'errors.documentTooShort')
        .max(18, 'errors.documentTooLong')
        .transform((val) => val.replace(/\D/g, '')), // Remove formatação
    cep: z
        .string()
        .regex(/^\d{5}-?\d{3}$/, 'errors.invalidCep')
        .transform((val) => val.replace('-', '')),
    street: z
        .string()
        .min(3, 'errors.addressTooShort')
        .max(200, 'errors.addressTooLong')
        .transform((val) => sanitizeString(val)),
    number: z
        .string()
        .min(1, 'errors.required')
        .max(20, 'errors.numberTooLong'),
    complement: z
        .string()
        .max(100, 'errors.complementTooLong')
        .optional()
        .transform((val) => val ? sanitizeString(val) : ''),
    neighborhood: z
        .string()
        .min(2, 'errors.neighborhoodTooShort')
        .max(100, 'errors.neighborhoodTooLong')
        .transform((val) => sanitizeString(val)),
    city: z
        .string()
        .min(2, 'errors.cityTooShort')
        .max(100, 'errors.cityTooLong')
        .transform((val) => sanitizeString(val)),
    state: z
        .string()
        .length(2, 'errors.stateInvalid')
        .transform((val) => val.toUpperCase()),
    phone: z
        .string()
        .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'errors.invalidPhone'),
});

// Schema para pagamento
export const paymentSchema = z.object({
    cardNumber: z
        .string()
        .regex(/^\d{16}$/, 'errors.invalidCard')
        .transform((val) => val.replace(/\D/g, '')),
    cardName: z
        .string()
        .min(2, 'errors.nameTooShort')
        .max(100, 'errors.nameTooLong')
        .transform((val) => sanitizeString(val).toUpperCase()),
    expiry: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'errors.expiryInvalid'),
    cvv: z
        .string()
        .regex(/^\d{3,4}$/, 'errors.cvvInvalid'),
});

// Schema para rastreamento
export const trackingSchema = z.object({
    code: z
        .string()
        .min(5, 'errors.codeTooShort')
        .max(30, 'errors.codeTooLong')
        .transform((val) => val.toUpperCase().trim()),
});

/**
 * Sanitiza strings removendo caracteres perigosos e prevenindo XSS básico.
 * Re-exportado de security.js para manter compatibilidade.
 * @deprecated Usar sanitizeInput de security.js diretamente
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return sanitizeInput(str);
};

/**
 * Valida dados usando um schema Zod e formata os erros para uso fácil no frontend.
 * @template T
 * @param {import('zod').ZodSchema<T>} schema - O schema Zod para validação
 * @param {unknown} data - Os dados a serem validados
 * @returns {{ success: true, data: T } | { success: false, errors: Record<string, string> }}
 */
export function validateForm(schema, data) {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = {};
            error.errors.forEach((err) => {
                const field = err.path.join('.');
                errors[field] = err.message;
            });
            return { success: false, errors };
        }
        return { success: false, errors: { _form: 'Erro de validação desconhecido' } };
    }
}

/**
 * Helper para obter a mensagem de erro de um campo específico.
 * Útil para integração com formulários controlados.
 * @param {Record<string, string>} errors - Objeto de erros retornado por validateForm
 * @param {string} field - Nome do campo
 * @returns {string|undefined} A mensagem de erro ou undefined
 */
export function getFieldError(errors, field) {
    return errors?.[field];
}

/**
 * Formata uma string numérica para o formato de CEP (00000-000).
 * @param {string} value - A string contendo o CEP (com ou sem formatação)
 * @returns {string} CEP formatado
 */
export function formatCEP(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
}

/**
 * Formata telefone para (DD) 0000-0000 ou (DD) 90000-0000.
 * @param {string} value - O telefone a ser formatado
 * @returns {string} Telefone formatado
 */
export function formatPhone(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

/**
 * Formata CPF ou CNPJ.
 * @param {string} value - O documento a ser formatado
 * @returns {string} Documento formatado
 */
export function formatDocument(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
        // CPF: 000.000.000-00
        return cleaned
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }
    // CNPJ: 00.000.000/0000-00
    return cleaned
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

/**
 * Formata número de cartão de crédito em grupos de 4 dígitos.
 * @param {string} value - O número do cartão
 * @returns {string} Número formatado (0000 0000 0000 0000)
 */
export function formatCardNumber(value) {
    const cleaned = value.replace(/\D/g, '');
    const groups = [];
    for (let i = 0; i < cleaned.length; i += 4) {
        groups.push(cleaned.slice(i, i + 4));
    }
    return groups.join(' ').trim();
}







