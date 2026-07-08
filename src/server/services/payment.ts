/**
 * Payment Service Abstraction
 *
 * Para adicionar um provider (ex.: Mercado Pago, Stripe):
 * 1. Crie uma classe que implemente PaymentProvider
 * 2. Implemente o createSession
 * 3. Adicione um case em getPaymentProvider()
 */

import { logInfo } from '../../lib/server/logger';

import type { CreateSessionOpts, PaymentProvider, PaymentSessionResult } from './types';

// Mock para desenvolvimento/testes.
class MockPaymentProvider implements PaymentProvider {
    async createSession({ items, currency }: CreateSessionOpts): Promise<PaymentSessionResult> {
        logInfo('MockPayment: criando sessão', `${items.length} itens`);

        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const randomId = Math.random().toString(36).substring(7);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        return {
            sessionId: `sess_${randomId}`,
            provider: 'mock',
            status: 'pending',
            amount: totalAmount,
            currency,
            // Em um cenário real, seria a URL para redirecionar o usuário.
            checkoutUrl: `/checkout?session_id=sess_${randomId}&status=success`,
            clientSecret: `pi_${randomId}_secret`,
            qrCode: '00020126360014BR.GOV.BCB.PIX...', // Exemplo para PIX
        };
    }
}

// Mercado Pago (placeholder).
class MercadoPagoProvider implements PaymentProvider {
    async createSession(_opts: CreateSessionOpts): Promise<PaymentSessionResult> {
        throw new Error('Mercado Pago provider is not fully configured yet. Please set up API keys.');
    }
}

/**
 * Factory do provider de pagamento ativo (process.env.PAYMENT_PROVIDER).
 */
export function getPaymentProvider(): PaymentProvider {
    const provider = process.env.PAYMENT_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
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
