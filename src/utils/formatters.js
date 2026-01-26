// src/utils/formatters.js

/**
 * Utilitários de formatação para internacionalização
 * Prepara a aplicação para suportar múltiplos idiomas no futuro
 */

// Configuração de locale padrão
const DEFAULT_LOCALE = 'pt-BR';
const DEFAULT_CURRENCY = 'BRL';

/**
 * Formata um valor monetário
 * @param {number} value - Valor a formatar
 * @param {string} locale - Locale (padrão: pt-BR)
 * @param {string} currency - Código da moeda (padrão: BRL)
 * @returns {string} Valor formatado (ex: "R$ 89,90")
 */
export function formatCurrency(value, locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY) {
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
 * @param {Date|string} date - Data a formatar
 * @param {string} locale - Locale (padrão: pt-BR)
 * @returns {string} Data formatada (ex: "12 de janeiro de 2026")
 */
export function formatDate(date, locale = DEFAULT_LOCALE) {
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
 * @param {Date|string} date - Data a formatar
 * @param {string} locale - Locale (padrão: pt-BR)
 * @returns {string} Data formatada (ex: "12/01/2026")
 */
export function formatShortDate(date, locale = DEFAULT_LOCALE) {
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
 * @param {Date|string} date - Data a formatar  
 * @param {string} locale - Locale (padrão: pt-BR)
 * @returns {string} Data e hora formatadas (ex: "12/01/2026 às 14:30")
 */
export function formatDateTime(date, locale = DEFAULT_LOCALE) {
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
 * @param {Date|string} date - Data a formatar
 * @param {string} locale - Locale (padrão: pt-BR)
 * @returns {string} Data relativa
 */
export function formatRelativeDate(date, locale = DEFAULT_LOCALE) {
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
 * @param {number} value - Número a formatar
 * @param {string} locale - Locale (padrão: pt-BR)
 * @returns {string} Número formatado (ex: "1.234.567")
 */
export function formatNumber(value, locale = DEFAULT_LOCALE) {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0';
    }

    return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formata porcentagem
 * @param {number} value - Valor em decimal (0.15 = 15%)
 * @param {string} locale - Locale (padrão: pt-BR)
 * @returns {string} Porcentagem formatada (ex: "15%")
 */
export function formatPercent(value, locale = DEFAULT_LOCALE) {
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







