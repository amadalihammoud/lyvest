
// src/utils/formatters.ts

/**
 * Utilitários de formatação para internacionalização
 * Prepara a aplicação para suportar múltiplos idiomas no futuro
 */

// Configuração de locale padrão
const DEFAULT_LOCALE = 'pt-BR';
const DEFAULT_CURRENCY = 'BRL';

/**
 * Formata um valor monetário
 * @param value - Valor a formatar
 * @param locale - Locale (padrão: pt-BR)
 * @param currency - Código da moeda (padrão: BRL)
 * @returns Valor formatado (ex: "R$ 89,90")
 */
export function formatCurrency(value: number, locale: string = DEFAULT_LOCALE, currency: string = DEFAULT_CURRENCY): string {
    if (typeof value !== 'number' || isNaN(value)) {
        return formatCurrency(0, locale, currency);
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formata uma data completa
 * @param date - Data a formatar
 * @param locale - Locale (padrão: pt-BR)
 * @returns Data formatada (ex: "12 de janeiro de 2026")
 */
export function formatDate(date: Date | string, locale: string = DEFAULT_LOCALE): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
    }

    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(dateObj);
}

/**
 * Formata uma data curta
 * @param date - Data a formatar
 * @param locale - Locale (padrão: pt-BR)
 * @returns Data formatada (ex: "12/01/2026")
 */
export function formatShortDate(date: Date | string, locale: string = DEFAULT_LOCALE): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return '--/--/----';
    }

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(dateObj);
}

/**
 * Formata data e hora
 * @param date - Data a formatar  
 * @param locale - Locale (padrão: pt-BR)
 * @returns Data e hora formatadas (ex: "12/01/2026 às 14:30")
 */
export function formatDateTime(date: Date | string, locale: string = DEFAULT_LOCALE): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return 'Data/hora inválida';
    }

    const dateStr = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(dateObj);

    const timeStr = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);

    return `${dateStr} às ${timeStr}`;
}

/**
 * Formata data relativa (ex: "há 2 dias", "amanhã")
 * @param date - Data a formatar
 * @param locale - Locale (padrão: pt-BR)
 * @returns Data relativa
 */
export function formatRelativeDate(date: Date | string, locale: string = DEFAULT_LOCALE): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
    }

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffDays) < 1) {
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        if (Math.abs(diffHours) < 1) {
            const diffMinutes = Math.round(diffMs / (1000 * 60));
            return rtf.format(diffMinutes, 'minute');
        }
        return rtf.format(diffHours, 'hour');
    }

    if (Math.abs(diffDays) < 30) {
        return rtf.format(diffDays, 'day');
    }

    const diffMonths = Math.round(diffDays / 30);
    if (Math.abs(diffMonths) < 12) {
        return rtf.format(diffMonths, 'month');
    }

    const diffYears = Math.round(diffDays / 365);
    return rtf.format(diffYears, 'year');
}

/**
 * Formata número com separadores
 * @param value - Número a formatar
 * @param locale - Locale (padrão: pt-BR)
 * @returns Número formatado (ex: "1.234.567")
 */
export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0';
    }

    return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formata porcentagem
 * @param value - Valor em decimal (0.15 = 15%)
 * @param locale - Locale (padrão: pt-BR)
 * @returns Porcentagem formatada (ex: "15%")
 */
export function formatPercent(value: number, locale: string = DEFAULT_LOCALE): string {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0%';
    }

    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    }).format(value);
}

// Export do locale padrão para uso em outros lugares
export { DEFAULT_LOCALE, DEFAULT_CURRENCY };

/**
 * Formata CEP (00000-000)
 */
export function formatCEP(value: string): string {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
}

/**
 * Formata Telefone (DD) 90000-0000 ou (DD) 0000-0000
 */
export function formatPhone(value: string): string {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    // Fix: Para 10 dígitos (Fixo), formato (XX) XXXX-XXXX
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    // Para 11 dígitos ou incompleto > 6
    if (cleaned.length <= 10) { // Tratando digitação
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

/**
 * Formata CPF/CNPJ
 */
export function formatDocument(value: string): string {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
        return cleaned
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }
    return cleaned
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

/**
 * Formata Cartão de Crédito
 */
export function formatCardNumber(value: string): string {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    const groups: string[] = [];
    for (let i = 0; i < cleaned.length; i += 4) {
        groups.push(cleaned.slice(i, i + 4));
    }
    return groups.join(' ').trim();
}
