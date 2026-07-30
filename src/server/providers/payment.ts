/**
 * Payment Provider Abstraction
 *
 * Asaas:
 *  - PIX → cobrança transparente (QR na própria loja)
 *  - cartão / default → Payment Link (redirect) — PCI
 */

import { buildAsaasPaymentLinkBody, formatGatewayErrors, isCallbackRejection } from './asaasPayload';
import { createAsaasPixPayment, ensureAsaasCustomer } from './asaasPix';
import { logError, logInfo } from '../../lib/server/logger';

export interface PaymentItem {
    id: string | number;
    name?: string;
    price: number;
    quantity: number;
}

export interface CreateSessionParams {
    items: PaymentItem[];
    currency: string;
    amount?: number;
    discountAmount?: number;
    metadata?: Record<string, string>;
    /** 'pix' → on-site; 'credit' ou omitido → hosted link. */
    paymentMethod?: 'credit' | 'pix';
}

export interface PaymentSession {
    sessionId: string;
    provider: string;
    status: 'pending' | 'paid' | 'failed';
    amount: number;
    currency: string;
    /** Redirect (cartão / link). Vazio no PIX on-site. */
    checkoutUrl: string;
    clientSecret?: string;
    /** Fluxo on-site PIX. */
    mode?: 'hosted' | 'pix_on_site';
    qrCode?: string;
    pixCopyPaste?: string;
    expiresAt?: string;
}

export abstract class PaymentProvider {
    abstract createSession(params: CreateSessionParams): Promise<PaymentSession>;
}

class MockPaymentProvider extends PaymentProvider {
    async createSession({ items, currency, amount, paymentMethod }: CreateSessionParams): Promise<PaymentSession> {
        logInfo('MockPayment: criando sessão', `${items.length} itens`);

        const totalAmount =
            typeof amount === 'number'
                ? amount
                : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const randomId = Math.random().toString(36).substring(7);

        await new Promise((resolve) => setTimeout(resolve, 400));

        if (paymentMethod === 'pix') {
            return {
                sessionId: `sess_pix_${randomId}`,
                provider: 'mock',
                status: 'pending',
                amount: totalAmount,
                currency,
                checkoutUrl: '',
                mode: 'pix_on_site',
                qrCode:
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136mock${randomId}52040000530398654${totalAmount.toFixed(2)}5802BR5907LYVEST6009SAOPAULO62070503***6304ABCD`,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            };
        }

        return {
            sessionId: `sess_${randomId}`,
            provider: 'mock',
            status: 'pending',
            amount: totalAmount,
            currency,
            checkoutUrl: `/checkout?session_id=sess_${randomId}&status=success`,
            mode: 'hosted',
            clientSecret: `pi_${randomId}_secret`,
        };
    }
}

type AsaasLinkResponse = {
    id?: string;
    url?: string;
    errors?: Array<{ code?: string; description?: string }>;
} | null;

class AsaasPaymentProvider extends PaymentProvider {
    private readonly baseUrl = process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';

    private async postLink(payload: Record<string, unknown>, apiKey: string) {
        const res = await fetch(`${this.baseUrl}/paymentLinks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                access_token: apiKey,
                'User-Agent': 'lyvest-ecommerce',
            },
            body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => null)) as AsaasLinkResponse;
        return { res, data };
    }

    private async createLink(body: ReturnType<typeof buildAsaasPaymentLinkBody>, apiKey: string) {
        const first = await this.postLink(body, apiKey);
        const precisaRetry =
            !first.res.ok && Boolean(body.callback) && isCallbackRejection(first.data?.errors);

        if (!precisaRetry) return first;

        logError(
            'asaas: callback rejeitado (conta sem domínio cadastrado) — recriando link sem redirect de retorno'
        );
        delete body.callback;
        return this.postLink(body, apiKey);
    }

    private async createPixOnSite(
        params: CreateSessionParams,
        apiKey: string
    ): Promise<PaymentSession> {
        void apiKey; // auth via asaasPix helpers
        const orderId = params.metadata?.orderId;
        const email = params.metadata?.customerEmail || 'checkout@lyvest.com.br';
        const name = params.metadata?.customerName || 'Cliente LyVest';

        const customerId = await ensureAsaasCustomer({
            name,
            email,
            cpfCnpj: params.metadata?.customerDocument || null,
        });

        const pix = await createAsaasPixPayment({
            customerId,
            items: params.items,
            amount: params.amount,
            orderId,
            description: orderId ? `Pedido LyVest ${orderId.slice(0, 8)}` : 'Pedido LyVest',
        });

        return {
            sessionId: pix.paymentId,
            provider: 'asaas',
            status: 'pending',
            amount: pix.value,
            currency: params.currency,
            checkoutUrl: '',
            mode: 'pix_on_site',
            qrCode: pix.encodedImage,
            pixCopyPaste: pix.payload,
            expiresAt: pix.expirationDate,
        };
    }

    async createSession(params: CreateSessionParams): Promise<PaymentSession> {
        const apiKey = process.env.ASAAS_API_KEY;
        if (!apiKey) {
            throw new Error('ASAAS_API_KEY ausente — configure o ambiente antes de usar o provider asaas.');
        }

        // PIX transparente: QR na loja, sem sair do site.
        if (params.paymentMethod === 'pix') {
            return this.createPixOnSite(params, apiKey);
        }

        const { items, currency, amount, metadata } = params;
        const orderId = metadata?.orderId || undefined;

        const body = buildAsaasPaymentLinkBody({
            items,
            amount,
            orderId,
            appUrl: metadata?.appUrl || process.env.NEXT_PUBLIC_APP_URL,
        });
        const totalAmount = body.value;

        const { res, data } = await this.createLink(body, apiKey);

        if (!res.ok || !data?.id || !data?.url) {
            const gatewayErrors = formatGatewayErrors(data?.errors);
            logError(
                `asaas: falha ao criar link de pagamento (HTTP ${res.status})${gatewayErrors ? ` — ${gatewayErrors}` : ''}`
            );
            throw new Error('Falha ao criar a cobrança no Asaas.');
        }

        logInfo('asaas: link de pagamento criado', data.id);
        return {
            sessionId: data.id,
            provider: 'asaas',
            status: 'pending',
            amount: totalAmount,
            currency,
            checkoutUrl: data.url,
            mode: 'hosted',
        };
    }
}

class MercadoPagoProvider extends PaymentProvider {
    async createSession(_params: CreateSessionParams): Promise<PaymentSession> {
        throw new Error('Mercado Pago provider is not fully configured yet. Please set up API keys.');
    }
}

export function getPaymentProvider(): PaymentProvider {
    const provider = process.env.PAYMENT_PROVIDER || 'mock';

    const isRealMoney = process.env.VERCEL_ENV
        ? process.env.VERCEL_ENV === 'production'
        : process.env.NODE_ENV === 'production';

    if (isRealMoney && provider.toLowerCase() === 'mock') {
        throw new Error(
            'PAYMENT_PROVIDER não configurado em produção: o provider mock confirma pedidos sem cobrar.'
        );
    }

    switch (provider.toLowerCase()) {
        case 'asaas':
            return new AsaasPaymentProvider();
        case 'mercadopago':
            return new MercadoPagoProvider();
        case 'stripe':
            throw new Error('Stripe not implemented yet');
        case 'mock':
        default:
            if (provider !== 'mock') {
                console.warn(`[PaymentFactory] Provider '${provider}' not found, falling back to Mock.`);
            }
            return new MockPaymentProvider();
    }
}
