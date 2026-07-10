/**
 * Payment Provider Abstraction
 *
 * Gerencia a interação com gateways de pagamento.
 * Para adicionar um provider (ex.: Mercado Pago, Stripe):
 * 1. Crie uma classe que estenda PaymentProvider
 * 2. Implemente o método createSession
 * 3. Adicione um case em getPaymentProvider()
 */

import { logInfo } from '../../lib/server/logger';

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
abstract class PaymentProvider {
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
