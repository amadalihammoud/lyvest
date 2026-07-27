/**
 * Payment Provider Abstraction
 *
 * Gerencia a interação com gateways de pagamento.
 * Para adicionar um provider (ex.: Mercado Pago, Stripe):
 * 1. Crie uma classe que estenda PaymentProvider
 * 2. Implemente o método createSession
 * 3. Adicione um case em getPaymentProvider()
 */

import { buildAsaasPaymentLinkBody, formatGatewayErrors, isCallbackRejection } from './asaasPayload';
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
type AsaasLinkResponse = {
    id?: string;
    url?: string;
    errors?: Array<{ code?: string; description?: string }>;
} | null;

class AsaasPaymentProvider extends PaymentProvider {
    private readonly baseUrl =
        process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';

    /** Transporte puro: um POST, sem regra de negócio. */
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

    /**
     * Cria o link, com uma única tentativa de recuperação.
     *
     * O Asaas só aceita `callback` quando a conta tem site cadastrado (Minha
     * Conta > Informações); sem isso devolve 400. Como o redirect de retorno é
     * acessório, recriamos o link sem ele em vez de perder a venda.
     *
     * Separado de createSession de propósito: aqui mora o protocolo (transporte
     * e retry), lá a orquestração. Misturar os dois era metade da complexidade
     * daquele método.
     */
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

    async createSession({ items, currency, amount, metadata }: CreateSessionParams): Promise<PaymentSession> {
        const apiKey = process.env.ASAAS_API_KEY;
        if (!apiKey) {
            throw new Error('ASAAS_API_KEY ausente — configure o ambiente antes de usar o provider asaas.');
        }

        const orderId = metadata?.orderId || undefined;

        // Montagem do payload vive em ./asaasPayload (pura e testada): é ela que
        // decide o VALOR cobrado — preferindo sempre o total autoritativo do
        // servidor sobre a soma dos itens — e se o redirect de retorno entra.
        // A URL de retorno é derivada do request (preview/prod na Vercel mudam
        // de host), com a env como fallback.
        const body = buildAsaasPaymentLinkBody({
            items,
            amount,
            orderId,
            appUrl: metadata?.appUrl || process.env.NEXT_PUBLIC_APP_URL,
        });
        // O valor reportado na sessão é o MESMO que foi enviado ao gateway.
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

    // Fail-closed: o MockPaymentProvider devolve uma checkoutUrl que aponta para
    // a própria loja com status=success, ou seja, confirma o pedido SEM cobrar.
    // Se PAYMENT_PROVIDER sumir ou vier grafado errado num deploy, é melhor o
    // checkout falhar visivelmente do que fechar venda fantasma.
    //
    // O discriminador é VERCEL_ENV, não NODE_ENV: em preview deployment da Vercel
    // NODE_ENV também vale 'production' (é um build de produção do Next), e usar
    // mock em preview é legítimo — o que não pode é mock cobrando cliente real.
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
