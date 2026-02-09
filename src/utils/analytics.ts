
// src/utils/analytics.ts
// Serviço de analytics preparado para integração com GA4, Plausible, etc.

import { ANALYTICS_CONFIG } from '../config/constants';
import { analyticsLogger } from './logger';

declare global {
    interface Window {
        gtag?: (command: string, eventName: string, params?: Record<string, any>) => void;
    }
}

/**
 * Eventos de analytics do e-commerce
 */
export const EVENTS = {
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
} as const;

export interface ProductItem {
    id: string | number;
    name: string;
    category?: string;
    price: number;
    [key: string]: any;
}

export interface CartItem extends ProductItem {
    qty: number;
}

export interface AnalyticsEvent {
    name: string;
    params: Record<string, any>;
}

/**
 * Serviço de Analytics
 */
export class AnalyticsService {
    private enabled: boolean;
    private gaId: string;
    private queue: AnalyticsEvent[];

    constructor() {
        this.enabled = ANALYTICS_CONFIG.ENABLED;
        this.gaId = ANALYTICS_CONFIG.GA_ID;
        this.queue = [];
    }

    /**
     * Inicializa o serviço (chamado no app startup)
     */
    init(): void {
        if (!this.enabled) {
            analyticsLogger.info('Desabilitado');
            return;
        }

        // Processar eventos na fila
        this.queue.forEach(event => this._send(event));
        this.queue = [];

        analyticsLogger.info('Inicializado');
    }

    /**
     * Envia evento (ou adiciona à fila se não inicializado)
     */
    private _send(event: AnalyticsEvent): void {
        if (!this.enabled) return;

        // Em produção, enviar para GA4/Plausible
        if (typeof window !== 'undefined' && window.gtag) {
            // window.gtag('event', event.name, event.params);
        }

        // Log para desenvolvimento
        analyticsLogger.debug(event.name, event.params);
    }

    /**
     * Registra evento
     */
    track(eventName: string, params: Record<string, any> = {}): void {
        const event: AnalyticsEvent = {
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
    pageView(pagePath: string, pageTitle: string): void {
        this.track(EVENTS.PAGE_VIEW, {
            page_path: pagePath,
            page_title: pageTitle
        });
    }

    /**
     * Visualização de produto
     */
    viewItem(product: ProductItem): void {
        this.track(EVENTS.VIEW_ITEM, {
            currency: 'BRL',
            value: product.price,
            items: [this._formatItem(product)]
        });
    }

    /**
     * Adicionar ao carrinho
     */
    addToCart(product: ProductItem, quantity: number = 1): void {
        this.track(EVENTS.ADD_TO_CART, {
            currency: 'BRL',
            value: product.price * quantity,
            items: [this._formatItem(product, quantity)]
        });
    }

    /**
     * Remover do carrinho
     */
    removeFromCart(product: ProductItem, quantity: number = 1): void {
        this.track(EVENTS.REMOVE_FROM_CART, {
            currency: 'BRL',
            value: product.price * quantity,
            items: [this._formatItem(product, quantity)]
        });
    }

    /**
     * Ver carrinho
     */
    viewCart(items: CartItem[], total: number): void {
        this.track(EVENTS.VIEW_CART, {
            currency: 'BRL',
            value: total,
            items: items.map(item => this._formatItem(item, item.qty))
        });
    }

    /**
     * Iniciar checkout
     */
    beginCheckout(items: CartItem[], total: number): void {
        this.track(EVENTS.BEGIN_CHECKOUT, {
            currency: 'BRL',
            value: total,
            items: items.map(item => this._formatItem(item, item.qty))
        });
    }

    /**
     * Adicionar info de pagamento
     */
    addPaymentInfo(paymentMethod: string, items: CartItem[], total: number): void {
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
    purchase(orderId: string, items: CartItem[], total: number, shipping: number = 0): void {
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
    search(searchTerm: string): void {
        this.track(EVENTS.SEARCH, {
            search_term: searchTerm
        });
    }

    /**
     * Adicionar aos favoritos
     */
    addToWishlist(product: ProductItem): void {
        this.track(EVENTS.ADD_TO_WISHLIST, {
            currency: 'BRL',
            value: product.price,
            items: [this._formatItem(product)]
        });
    }

    /**
     * Inscrição newsletter
     */
    newsletterSignup(email: string): void {
        this.track(EVENTS.NEWSLETTER_SIGNUP, {
            method: 'email',
            // Não enviar email completo por privacidade
            email_domain: email.split('@')[1]
        });
    }

    /**
     * Registrar erro/exceção
     */
    exception(description: string, fatal: boolean = false): void {
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
    private _formatItem(product: ProductItem, quantity: number = 1) {
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
// export { EVENTS }; // Already exported as const

// Exportar classe para testes
// export { AnalyticsService }; // Already exported class
