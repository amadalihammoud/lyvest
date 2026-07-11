/**
 * Payment Provider Abstraction
 *
 * Gerencia a interação com gateways de pagamento.
 * Para adicionar um provider (ex.: Mercado Pago, Stripe):
 * 1. Crie uma classe que estenda PaymentProvider
 * 2. Implemente o método createSession
 * 3. Adicione um case em getPaymentProvider()
 */

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
    /** Valor autoritativo calculado no servidor (com desconto). Sempre preferido. */
    amount?: number;
    discountAmount?: number;
    metadata?: Record<string, string>;
}

export interface PaymentSession {
    sessionId: string;
    provider: string;
    status: 'pending' | 'paid' | 'failed';
    amount: number;
    currency: string;
    /** Em produção, URL de redirecionamento do gateway. */
    checkoutUrl: string;
    clientSecret?: string;
    qrCode?: string;
}

// Classe base (interface)
export abstract class PaymentProvider {
    abstract createSession(params: CreateSessionParams): Promise<PaymentSession>;
}

// Implementação Mock (desenvolvimento/testes)
class MockPaymentProvider extends PaymentProvider {
    async createSession({ items, currency, amount }: CreateSessionParams): Promise<PaymentSession> {
        logInfo('MockPayment: criando sessão', `${items.length} itens`);

        // Usa o valor autoritativo calculado no servidor (com desconto já aplicado) quando
        // presente; só cai no somatório dos itens como último recurso.
        const totalAmount =
            typeof amount === 'number'
                ? amount
                : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const randomId = Math.random().toString(36).substring(7);

        // Simula latência de rede
        await new Promise((resolve) => setTimeout(resolve, 800));

        return {
            sessionId: `sess_${randomId}`,
            provider: 'mock',
            status: 'pending',
            amount: totalAmount,
            currency,
            // Em cenário real, URL para redirecionar o usuário
            checkoutUrl: `/checkout?session_id=sess_${randomId}&status=success`,
            clientSecret: `pi_${randomId}_secret`,
            qrCode: '00020126360014BR.GOV.BCB.PIX...', // Exemplo para PIX
        };
    }
}

// Implementação Asaas — checkout HOSPEDADO via Link de Pagamentos.
// PCI: nenhum dado de cartão passa pelo LyVest; o cliente paga (Pix, cartão até 6x
// ou boleto) na página do Asaas. Sandbox/produção definidos por ASAAS_BASE_URL.
class AsaasPaymentProvider extends PaymentProvider {
    private readonly baseUrl =
        process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';

    async createSession({ items, currency, amount, metadata }: CreateSessionParams): Promise<PaymentSession> {
        const apiKey = process.env.ASAAS_API_KEY;
        if (!apiKey) {
            throw new Error('ASAAS_API_KEY ausente — configure o ambiente antes de usar o provider asaas.');
        }

        const totalAmount =
            typeof amount === 'number'
                ? amount
                : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const orderId = metadata?.orderId || undefined;
        const summary = items
            .slice(0, 5)
            .map((i) => `${i.quantity}x ${i.name ?? i.id}`)
            .join(', ')
            .slice(0, 255);

        const body: Record<string, unknown> = {
            name: orderId ? `Pedido LyVest ${String(orderId).slice(0, 8).toUpperCase()}` : 'Pedido LyVest',
            description: summary || undefined,
            value: Math.round(totalAmount * 100) / 100,
            billingType: 'UNDEFINED', // pagador escolhe: Pix, cartão ou boleto
            chargeType: 'DETACHED',
            dueDateLimitDays: 3,
            maxInstallmentCount: 6, // política da loja: até 6x
            externalReference: orderId, // volta no webhook (payment.externalReference)
            notificationEnabled: false,
        };
        // URL de retorno: derivada do request (preview/prod na Vercel mudam de host);
        // env como fallback. O Asaas rejeita callback http/localhost — nesse caso omitimos
        // o callback em vez de derrubar a cobrança inteira.
        const appUrl = metadata?.appUrl || process.env.NEXT_PUBLIC_APP_URL;
        if (appUrl && appUrl.startsWith('https://')) {
            body.callback = {
                successUrl: `${appUrl}/checkout?status=success${orderId ? `&order=${orderId}` : ''}`,
                autoRedirect: true,
            };
        }

        type AsaasLinkResponse = {
            id?: string;
            url?: string;
            errors?: Array<{ code?: string; description?: string }>;
        } | null;
        const postLink = async (payload: Record<string, unknown>) => {
            const response = await fetch(`${this.baseUrl}/paymentLinks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    access_token: apiKey,
                    'User-Agent': 'lyvest-ecommerce',
                },
                body: JSON.stringify(payload),
            });
            const parsed = (await response.json().catch(() => null)) as AsaasLinkResponse;
            return { response, parsed };
        };

        let { response: res, parsed: data } = await postLink(body);

        // O Asaas só aceita callback quando a conta tem um site cadastrado
        // (Minha Conta > Informações). Sem isso, retorna 400 invalid_object.
        // O redirect de retorno é acessório: recriamos o link sem callback
        // em vez de perder a venda.
        if (!res.ok && body.callback) {
            const desc = (data?.errors ?? []).map((e) => e.description ?? '').join(' ');
            if (/dom[ií]nio|callback/i.test(desc)) {
                logError('asaas: callback rejeitado (conta sem domínio cadastrado) — recriando link sem redirect de retorno');
                delete body.callback;
                ({ response: res, parsed: data } = await postLink(body));
            }
        }

        if (!res.ok || !data?.id || !data?.url) {
            // Erros de validação do gateway (código+descrição) não contêm dados do cliente —
            // entram no rótulo para serem visíveis também em produção (o logger suprime detail).
            const gatewayErrors = (data?.errors ?? [])
                .map((e) => `${e.code ?? '?'}: ${e.description ?? ''}`)
                .join('; ')
                .slice(0, 300);
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
        };
    }
}

// Implementação Mercado Pago (placeholder)
class MercadoPagoProvider extends PaymentProvider {
    async createSession(_params: CreateSessionParams): Promise<PaymentSession> {
        // TODO: instalar o SDK 'mercadopago'
        // import { MercadoPagoConfig, Preference } from 'mercadopago';
        // const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        throw new Error('Mercado Pago provider is not fully configured yet. Please set up API keys.');
    }
}

/** Factory: retorna o provider de pagamento ativo (process.env.PAYMENT_PROVIDER). */
export function getPaymentProvider(): PaymentProvider {
    const provider = process.env.PAYMENT_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'asaas':
            return new AsaasPaymentProvider();
        case 'mercadopago':
            return new MercadoPagoProvider();
        case 'stripe':
            // return new StripeProvider();
            throw new Error('Stripe not implemented yet');
        case 'mock':
        default:
            if (provider !== 'mock') {
                console.warn(`[PaymentFactory] Provider '${provider}' not found, falling back to Mock.`);
            }
            return new MockPaymentProvider();
    }
}
