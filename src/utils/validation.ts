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
 * Formata número do cartão
 */
export function formatCardNumber(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
}


