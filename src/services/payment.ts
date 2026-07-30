// src/services/payment.ts
// Cliente browser → /api/payment/create-session

import { PAYMENT_CONFIG } from '../config/constants';
import { paymentLogger } from '../utils/logger';

export interface OrderItem {
    id: string | number;
    name?: string;
    price?: number;
    qty?: number;
    quantity?: number;
    image?: string;
    category?: string;
    variantId?: string;
    [key: string]: unknown;
}

export interface OrderData {
    total: number;
    items: OrderItem[];
    [key: string]: unknown;
}

export interface PaymentSession {
    sessionId: string;
    checkoutUrl: string;
    status: string;
    mode?: string;
    qrCode?: string;
    pixCopyPaste?: string;
    orderId?: string;
    expiresAt?: string;
}

export interface PaymentResult {
    transactionId: string;
    status: string;
    message?: string;
    timestamp?: string;
    pixCode?: string;
    qrCodeUrl?: string;
    amount?: number;
    discount?: number;
    expiresAt?: string;
}

export interface RefundResult {
    refundId: string;
    transactionId: string;
    amount: number | null;
    status: string;
    message: string;
}

export class PaymentService {
    private gateway: string;

    constructor() {
        this.gateway = PAYMENT_CONFIG.DEFAULT_GATEWAY;
    }

    setGateway(gateway: string): void {
        if ((PAYMENT_CONFIG.GATEWAYS as readonly string[]).includes(gateway)) {
            this.gateway = gateway;
        } else {
            throw new Error(`Gateway não suportado: ${gateway}`);
        }
    }

    async createPaymentSession(orderData: OrderData): Promise<PaymentSession> {
        paymentLogger.info(`Iniciando pagamento seguro via Backend (${this.gateway})`, orderData);

        try {
            const isLocalhost =
                window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            const response = await fetch('/api/payment/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                if (response.status === 404 && isLocalhost) {
                    paymentLogger.warn('API Backend não encontrada. Usando MOCK local.');
                    await new Promise((r) => setTimeout(r, 400));
                    return {
                        sessionId: `mock_sess_${Date.now()}`,
                        checkoutUrl: `/checkout?session_id=mock_${Date.now()}&status=success`,
                        status: 'pending',
                    };
                }
                const errorData = (await response.json().catch(() => ({}))) as {
                    message?: string;
                };
                // Mensagem da API (ex.: "Informe um e-mail válido para pagar com Pix.")
                throw new Error(
                    typeof errorData.message === 'string' && errorData.message.length > 0
                        ? errorData.message
                        : `Erro no servidor: ${response.status}`
                );
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            paymentLogger.error('Payment Service Error:', error);
            throw error;
        }
    }

    async processCardPayment(
        sessionId: string,
        paymentData: Record<string, unknown>
    ): Promise<PaymentResult> {
        paymentLogger.debug(`Processando pagamento (${this.gateway})`, { sessionId, paymentData });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return {
            transactionId: `txn_${Date.now()}`,
            status: 'approved',
            message: 'Pagamento aprovado com sucesso',
            timestamp: new Date().toISOString(),
        };
    }

    async generatePixCode(orderData: OrderData): Promise<PaymentResult> {
        paymentLogger.info(`Gerando código PIX (${this.gateway})`, orderData);
        await new Promise((resolve) => setTimeout(resolve, 800));
        const pixDiscount = orderData.total * PAYMENT_CONFIG.PIX_DISCOUNT;
        const finalAmount = orderData.total - pixDiscount;
        return {
            transactionId: `pix_${Date.now()}`,
            status: 'pending',
            pixCode: `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${finalAmount.toFixed(2)}5802BR5907LY VEST6009SAO PAULO62070503***6304`,
            qrCodeUrl: '/pix-qr-placeholder.png',
            amount: finalAmount,
            discount: pixDiscount,
            expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
        };
    }

    async checkPaymentStatus(transactionId: string): Promise<PaymentResult> {
        paymentLogger.debug(`Verificando status (${this.gateway})`, transactionId);
        return { transactionId, status: 'approved' };
    }

    async requestRefund(transactionId: string, amount: number | null = null): Promise<RefundResult> {
        paymentLogger.info(`Solicitando reembolso (${this.gateway})`, { transactionId, amount });
        return {
            refundId: `ref_${Date.now()}`,
            transactionId,
            amount,
            status: 'pending',
            message: 'Reembolso será processado em até 7 dias úteis',
        };
    }
}

export const paymentService = new PaymentService();
