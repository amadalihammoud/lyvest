// src/server/services/types.ts
// Contratos tipados da camada de domínio server-side (payment/shipping/erp/products).
// Substituem os casts estruturais (`as unknown as {...}`) que as rotas faziam para
// consumir os módulos .js — agora o compilador verifica o fluxo de ponta a ponta.

// ---- Pagamento ----
export interface PaymentItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
}

export interface CreateSessionOpts {
    items: PaymentItem[];
    currency: string;
    metadata?: Record<string, string>;
}

export interface PaymentSessionResult {
    sessionId: string;
    status: string;
    provider?: string;
    amount?: number;
    currency?: string;
    checkoutUrl?: string;
    clientSecret?: string;
    qrCode?: string;
    [key: string]: unknown;
}

export interface PaymentProvider {
    createSession(opts: CreateSessionOpts): Promise<PaymentSessionResult>;
}

// ---- Frete ----
export interface ShippingItem {
    id: string | number;
    quantity: number;
    price: number;
}

export interface ShippingCalcOpts {
    zipCode: string;
    items: ShippingItem[];
}

export interface ShippingOption {
    id: string;
    carrier: string;
    service: string;
    price: number;
    originalPrice: number;
    deliveryDays: number;
    deliveryRange: string;
    isFree: boolean;
}

export interface ShippingProvider {
    calculate(opts: ShippingCalcOpts): Promise<ShippingOption[]>;
}

// ---- ERP ----
export interface ErpResult {
    success: boolean;
    provider?: string;
    erpReferenceId?: string;
    message?: string;
    [key: string]: unknown;
}

export interface ErpProvider {
    sendOrder(orderData: Record<string, unknown>): Promise<ErpResult>;
}

// ---- Produtos (contexto do chat) ----
export interface ProductContext {
    id?: string | number;
    name: string;
    price: number;
    category?: string;
    description?: string;
    image?: string;
    specs?: unknown;
}
