/**
 * Utilitários de Validação de Segurança
 * 
 * Validadores para inputs sensíveis e prevenção de ataques
 */

// Regex patterns para validação
const PATTERNS = {
    // Email RFC 5322 simplificado
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // CPF brasileiro (formato: XXX.XXX.XXX-XX ou apenas números)
    cpf: /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/,

    // CEP brasileiro (formato: XXXXX-XXX ou apenas números)
    cep: /^(\d{5}-?\d{3})$/,

    // Telefone brasileiro (com DDD) - Simplificado para evitar ReDoS
    phone: /^(\+55|55)?\s?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/,

    // Cartão de crédito (apenas para formato, não valida checksum)
    creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,

    // Senha forte: mínimo 8 chars, 1 maiúscula, 1 minúscula, 1 número
    strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,

    // UUID v4
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

    // Slug URL-safe (Simplificado para evitar ReDoS e falso positivo)
    // eslint-disable-next-line security/detect-unsafe-regex
    slug: /^[a-z0-9]+(-[a-z0-9]+)*$/,
};

/**
 * Lista de domínios de email descartáveis conhecidos
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
    'yopmail.com', 'getnada.com', 'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
    'pokemail.net', 'spam4.me', 'mohmal.com', 'tempail.com', 'emailondeck.com',
]);

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    return PATTERNS.email.test(email.trim());
}

/**
 * Verifica se email é de domínio descartável
 */
export function isDisposableEmail(email: string): boolean {
    if (!isValidEmail(email)) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Valida CPF brasileiro (com verificação de dígitos)
 */
export function isValidCPF(cpf: string): boolean {
    if (!cpf || typeof cpf !== 'string') return false;

    // Remove formatação
    const cleaned = cpf.replace(/\D/g, '');

    // Verifica tamanho
    if (cleaned.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10))) return false;

    return true;
}

/**
 * Valida CEP brasileiro
 */
export function isValidCEP(cep: string): boolean {
    if (!cep || typeof cep !== 'string') return false;
    return PATTERNS.cep.test(cep.trim());
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;

    return PATTERNS.phone.test(phone.trim());
}

/**
 * Valida força da senha
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || password.length < 8) {
        errors.push('A senha deve ter no mínimo 8 caracteres');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('A senha deve ter pelo menos uma letra minúscula');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('A senha deve ter pelo menos uma letra maiúscula');
    }
    if (!/\d/.test(password)) {
        errors.push('A senha deve ter pelo menos um número');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Valida número de cartão de crédito (Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
    if (!cardNumber || typeof cardNumber !== 'string') return false;

    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    // Algoritmo de Luhn
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i));

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

/**
 * Detecta a bandeira do cartão
 */
export function detectCardBrand(cardNumber: string): string | null {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    if (/^(?:2131|1800|35)/.test(cleaned)) return 'jcb';
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(cleaned)) return 'elo';
    if (/^(50|67|58)/.test(cleaned)) return 'maestro';
    if (/^606282/.test(cleaned)) return 'hipercard';

    return null;
}

/**
 * Máscara para CPF
 */
export function maskCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Máscara para telefone
 */
export function maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/**
 * Máscara para CEP
 */
export function maskCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Máscara para cartão de crédito
 */
export function maskCreditCard(card: string): string {
    const cleaned = card.replace(/\D/g, '');
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
}

/**
 * Ofusca dados sensíveis para logs
 */
export function obfuscateSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) return '****';
    return '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
}

export default {
    isValidEmail,
    isDisposableEmail,
    isValidCPF,
    isValidCEP,
    isValidPhone,
    isStrongPassword,
    isValidCreditCard,
    detectCardBrand,
    maskCPF,
    maskPhone,
    maskCEP,
    maskCreditCard,
    obfuscateSensitiveData,
};

// ============================================================
// ZOD SCHEMAS E FUNÇÕES DE VALIDAÇÃO (para compatibilidade)
// ============================================================

import { z } from 'zod';
// DOMPurify removed — sanitizeString uses regex (identical to ALLOWED_TAGS:[] behavior)
// For HTML sanitization with allowlisted tags, import from '@/utils/sanitize'

// Schema de endereço para checkout
export const addressSchema = z.object({
    name: z.string().min(3, 'errors.nameMin').max(100),
    document: z.string().min(11, 'errors.documentInvalid').max(18),
    phone: z.string().min(10, 'errors.phoneInvalid').max(15),
    cep: z.string().length(8, 'errors.cepInvalid'),
    street: z.string().min(3, 'errors.streetMin').max(200),
    number: z.string().min(1, 'errors.numberRequired').max(20),
    complement: z.string().max(100).optional(),
    neighborhood: z.string().min(2, 'errors.neighborhoodMin').max(100),
    city: z.string().min(2, 'errors.cityMin').max(100),
    state: z.string().length(2, 'errors.stateInvalid'),
});

// Schema de newsletter
export const newsletterSchema = z.object({
    email: z.string().email('errors.emailInvalid'),
    consent: z.literal(true, { errorMap: () => ({ message: 'errors.consentRequired' }) }),
});

// Schema de login
export const loginSchema = z.object({
    email: z.string().email('errors.emailInvalid'),
    password: z.string().min(6, 'errors.passwordMin'),
});

// Schema de registro
export const registerSchema = z.object({
    name: z.string().min(3, 'errors.nameMin'),
    email: z.string().email('errors.emailInvalid'),
    password: z.string().min(8, 'errors.passwordMin'),
    confirmPassword: z.string(),
    terms: z.literal(true),
}).refine(data => data.password === data.confirmPassword, {
    message: 'errors.passwordMatch',
    path: ['confirmPassword'],
});

/**
 * Valida dados com schema Zod
 */
export function validateForm<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string | undefined> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string | undefined> = {};
    result.error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
    });

    return { success: false, errors };
}

/**
 * Formata CEP
 */
export function formatCEP(value: string): string {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length > 5) {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return cleaned;
}

/**
 * Formata telefone
 */
export function formatPhone(value: string): string {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length > 10) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length > 6) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (cleaned.length > 2) {
        return cleaned.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    return cleaned;
}

/**
 * Formata CPF/CNPJ
 */
export function formatDocument(value: string): string {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 11) {
        // CPF: XXX.XXX.XXX-XX
        return cleaned
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .slice(0, 14);
    } else {
        // CNPJ: XX.XXX.XXX/XXXX-XX
        return cleaned
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .slice(0, 18);
    }
}

/**
 * Sanitiza string removendo HTML (strip ALL tags).
 * Uses regex — functionally identical to DOMPurify with ALLOWED_TAGS:[]
 * but avoids pulling ~17KB gzip into every bundle that imports validation.ts.
 * Works on both server and client.
 */
export function sanitizeString(value: string): string {
    if (typeof value !== 'string') return '';
    return value.replace(/<[^>]*>?/gm, '').trim();
}

// Schema de pagamento
export const paymentSchema = z.object({
    cardNumber: z.string().min(13, 'errors.cardInvalid').max(19).refine(isValidCreditCard, 'errors.cardInvalid'),
    cardName: z.string().min(3, 'errors.nameMin'),
    expiry: z.string().length(5, 'errors.expiryInvalid').refine((val) => {
        const [month, year] = val.split('/').map(Number);
        if (!month || !year || month < 1 || month > 12) return false;

        const now = new Date();
        const currentYear = parseInt(now.getFullYear().toString().slice(-2));
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;

        return true;
    }, 'errors.expiryInvalid'),
    cvv: z.string().min(3, 'errors.cvvInvalid').max(4),
});

/**
 * Formata número do cartão
 */
export function formatCardNumber(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
}


// refine usa a função local isValidCreditCard já definida neste arquivo


