
// src/config/constants.ts
// Arquivo centralizado de constantes da aplicação

/**
 * Configurações do Carrinho
 */
export const CART_CONFIG = {
    MAX_ITEMS: 50,
    MAX_QUANTITY_PER_ITEM: 99,
    MAX_PRICE: 100000,
    STORAGE_KEY: 'lyvest_cart'
} as const;

/**
 * Configurações de Favoritos
 */
export const FAVORITES_CONFIG = {
    MAX_ITEMS: 100,
    STORAGE_KEY: 'lyvest_favorites'
} as const;

/**
 * Configurações de Rate Limiting
 */
export const RATE_LIMIT_CONFIG = {
    NEWSLETTER: {
        MAX_ATTEMPTS: 3,
        WINDOW_MS: 60000 // 1 minuto
    },
    CHECKOUT: {
        MAX_ATTEMPTS: 3,
        WINDOW_MS: 300000 // 5 minutos
    },
    LOGIN: {
        MAX_ATTEMPTS: 5,
        WINDOW_MS: 900000 // 15 minutos
    }
} as const;

/**
 * Configurações de Validação
 */
export const VALIDATION_CONFIG = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 100,
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 50,
    PHONE_REGEX: /^\(?[1-9]{2}\)?\s?[9]?[0-9]{4}-?[0-9]{4}$/,
    CEP_REGEX: /^\d{5}-?\d{3}$/,
    CARD_NUMBER_LENGTH: 16,
    CVV_MIN_LENGTH: 3,
    CVV_MAX_LENGTH: 4
} as const;

/**
 * Configurações de Busca
 */
export const SEARCH_CONFIG = {
    MAX_LENGTH: 50,
    DEBOUNCE_MS: 300
} as const;

/**
 * Configurações de Frete
 */
export const SHIPPING_CONFIG = {
    FREE_SHIPPING_THRESHOLD: 150,
    DEFAULT_SHIPPING_COST: 15.90
} as const;

/**
 * URLs de API (para futura integração)
 */
export const API_URLS = {
    BASE: process.env.NEXT_PUBLIC_API_URL || '/api',
    PRODUCTS: '/products',
    ORDERS: '/orders',
    TRACKING: '/tracking',
    NEWSLETTER: '/newsletter'
} as const;

/**
 * Configurações de PWA
 */
export const PWA_CONFIG = {
    THEME_COLOR: '#faf5ff',
    BACKGROUND_COLOR: '#ffffff',
    APP_NAME: 'Ly Vest'
} as const;

/**
 * Configurações de Analytics (futura integração)
 */
export const ANALYTICS_CONFIG = {
    ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    GA_ID: process.env.NEXT_PUBLIC_GA_ID || ''
} as const;

/**
 * Configurações de Pagamento (gateways suportados)
 */
export const PAYMENT_CONFIG = {
    GATEWAYS: ['stripe', 'pagseguro', 'mercadopago'],
    DEFAULT_GATEWAY: 'mercadopago',
    PIX_DISCOUNT: 0.05 // 5% de desconto
} as const;

/**
 * Configurações de Internacionalização
 */
export const I18N_CONFIG = {
    DEFAULT_LOCALE: 'pt-BR',
    SUPPORTED_LOCALES: ['pt-BR', 'en-US', 'es-ES'],
    CURRENCY: 'BRL'
} as const;

/**
 * Configurações de Conversão de Moeda
 * Taxas fixas para fallback - idealmente substituir por API de câmbio (ex: BCB)
 */
export const CURRENCY_RATES = {
    BRL_TO_USD: 6.0,
    BRL_TO_EUR: 6.5,
} as const;
