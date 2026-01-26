// src/config/constants.js
// Arquivo centralizado de constantes da aplicação

/**
 * Configurações do Carrinho
 */
export const CART_CONFIG = {
    MAX_ITEMS: 50,
    MAX_QUANTITY_PER_ITEM: 99,
    MAX_PRICE: 100000,
    STORAGE_KEY: 'lyvest_cart'
};

/**
 * Configurações de Favoritos
 */
export const FAVORITES_CONFIG = {
    MAX_ITEMS: 100,
    STORAGE_KEY: 'lyvest_favorites'
};

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
};

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
};

/**
 * Configurações de Busca
 */
export const SEARCH_CONFIG = {
    MAX_LENGTH: 50,
    DEBOUNCE_MS: 300
};

/**
 * Configurações de Frete
 */
export const SHIPPING_CONFIG = {
    FREE_SHIPPING_THRESHOLD: 150,
    DEFAULT_SHIPPING_COST: 15.90
};

/**
 * URLs de API (para futura integração)
 */
export const API_URLS = {
    BASE: import.meta.env.VITE_API_URL || '/api',
    PRODUCTS: '/products',
    ORDERS: '/orders',
    TRACKING: '/tracking',
    NEWSLETTER: '/newsletter'
};

/**
 * Configurações de PWA
 */
export const PWA_CONFIG = {
    THEME_COLOR: '#faf5ff',
    BACKGROUND_COLOR: '#ffffff',
    APP_NAME: 'Ly Vest'
};

/**
 * Configurações de Analytics (futura integração)
 */
export const ANALYTICS_CONFIG = {
    ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
    GA_ID: import.meta.env.VITE_GA_ID || ''
};

/**
 * Configurações de Pagamento (gateways suportados)
 */
export const PAYMENT_CONFIG = {
    GATEWAYS: ['stripe', 'pagseguro', 'mercadopago'],
    DEFAULT_GATEWAY: 'mercadopago',
    PIX_DISCOUNT: 0.05 // 5% de desconto
};

/**
 * Configurações de Internacionalização
 */
export const I18N_CONFIG = {
    DEFAULT_LOCALE: 'pt-BR',
    SUPPORTED_LOCALES: ['pt-BR', 'en-US', 'es-ES'],
    CURRENCY: 'BRL'
};







