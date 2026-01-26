// src/utils/analytics.js
// Serviço de analytics preparado para integração com GA4, Plausible, etc.

import { ANALYTICS_CONFIG } from '../config/constants';

/**
 * Eventos de analytics do e-commerce
 */
const EVENTS = {
    // Navegação
    PAGE_VIEW: 'page_view',

    // E-commerce
    VIEW_ITEM: 'view_item',
    ADD_TO_CART: 'add_to_cart',
    REMOVE_FROM_CART: 'remove_from_cart',
    VIEW_CART: 'view_cart',
    BEGIN_CHECKOUT: 'begin_checkout',
    ADD_PAYMENT_INFO: 'add_payment_info',
    ADD_SHIPPING_INFO: 'add_shipping_info',
    PURCHASE: 'purchase',

    // Engajamento
    SEARCH: 'search',
    ADD_TO_WISHLIST: 'add_to_wishlist',
    SHARE: 'share',

    // Newsletter
    NEWSLETTER_SIGNUP: 'newsletter_signup',

    // Erros
    EXCEPTION: 'exception'
};

/**
 * Serviço de Analytics
 */
class AnalyticsService {
    constructor() {
        this.enabled = ANALYTICS_CONFIG.ENABLED;
        this.gaId = ANALYTICS_CONFIG.GA_ID;
        this.queue = [];
    }

    /**
     * Inicializa o serviço (chamado no app startup)
     */
    init() {
        if (!this.enabled) {
            console.log('[Analytics] Desabilitado');
            return;
        }

        // Processar eventos na fila
        this.queue.forEach(event => this._send(event));
        this.queue = [];

        console.log('[Analytics] Inicializado');
    }

    /**
     * Envia evento (ou adiciona à fila se não inicializado)
     */
    _send(event) {
        if (!this.enabled) return;

        // Em produção, enviar para GA4/Plausible
        // window.gtag?.('event', event.name, event.params);

        // Log para desenvolvimento
        if (import.meta.env.DEV) {
            console.log('[Analytics]', event.name, event.params);
        }
    }

    /**
     * Registra evento
     */
    track(eventName, params = {}) {
        const event = {
            name: eventName,
            params: {
                ...params,
                timestamp: new Date().toISOString()
            }
        };

        if (this.enabled) {
            this._send(event);
        } else {
            this.queue.push(event);
        }
    }

    // ==========================================
    // EVENTOS DE E-COMMERCE
    // ==========================================

    /**
     * Visualização de página
     */
    pageView(pagePath, pageTitle) {
        this.track(EVENTS.PAGE_VIEW, {
            page_path: pagePath,
            page_title: pageTitle
        });
    }

    /**
     * Visualização de produto
     */
    viewItem(product) {
        this.track(EVENTS.VIEW_ITEM, {
            currency: 'BRL',
            value: product.price,
            items: [this._formatItem(product)]
        });
    }

    /**
     * Adicionar ao carrinho
     */
    addToCart(product, quantity = 1) {
        this.track(EVENTS.ADD_TO_CART, {
            currency: 'BRL',
            value: product.price * quantity,
            items: [this._formatItem(product, quantity)]
        });
    }

    /**
     * Remover do carrinho
     */
    removeFromCart(product, quantity = 1) {
        this.track(EVENTS.REMOVE_FROM_CART, {
            currency: 'BRL',
            value: product.price * quantity,
            items: [this._formatItem(product, quantity)]
        });
    }

    /**
     * Ver carrinho
     */
    viewCart(items, total) {
        this.track(EVENTS.VIEW_CART, {
            currency: 'BRL',
            value: total,
            items: items.map(item => this._formatItem(item, item.qty))
        });
    }

    /**
     * Iniciar checkout
     */
    beginCheckout(items, total) {
        this.track(EVENTS.BEGIN_CHECKOUT, {
            currency: 'BRL',
            value: total,
            items: items.map(item => this._formatItem(item, item.qty))
        });
    }

    /**
     * Adicionar info de pagamento
     */
    addPaymentInfo(paymentMethod, items, total) {
        this.track(EVENTS.ADD_PAYMENT_INFO, {
            currency: 'BRL',
            value: total,
            payment_type: paymentMethod,
            items: items.map(item => this._formatItem(item, item.qty))
        });
    }

    /**
     * Compra concluída
     */
    purchase(orderId, items, total, shipping = 0) {
        this.track(EVENTS.PURCHASE, {
            transaction_id: orderId,
            currency: 'BRL',
            value: total,
            shipping: shipping,
            items: items.map(item => this._formatItem(item, item.qty))
        });
    }

    /**
     * Busca
     */
    search(searchTerm) {
        this.track(EVENTS.SEARCH, {
            search_term: searchTerm
        });
    }

    /**
     * Adicionar aos favoritos
     */
    addToWishlist(product) {
        this.track(EVENTS.ADD_TO_WISHLIST, {
            currency: 'BRL',
            value: product.price,
            items: [this._formatItem(product)]
        });
    }

    /**
     * Inscrição newsletter
     */
    newsletterSignup(email) {
        this.track(EVENTS.NEWSLETTER_SIGNUP, {
            method: 'email',
            // Não enviar email completo por privacidade
            email_domain: email.split('@')[1]
        });
    }

    /**
     * Registrar erro/exceção
     */
    exception(description, fatal = false) {
        this.track(EVENTS.EXCEPTION, {
            description,
            fatal
        });
    }

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Formata item para padrão GA4
     */
    _formatItem(product, quantity = 1) {
        return {
            item_id: String(product.id),
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            quantity: quantity
        };
    }
}

// Instância singleton
export const analytics = new AnalyticsService();

// Exportar eventos para uso externo
export { EVENTS };

// Exportar classe para testes
export { AnalyticsService };







