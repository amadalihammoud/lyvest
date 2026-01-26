/* global process */
/* eslint-disable no-unused-vars */
/**
 * Payment Service Abstraction
 * 
 * This service manages the interaction with Payment Gateways.
 * To add a new provider (e.g., Mercado Pago, Stripe):
 * 1. Create a class that extends PaymentProvider
 * 2. Implement the createSession method
 * 3. Add a case in getPaymentProvider()
 */

// Base Class (Interface)
class PaymentProvider {
    /**
     * Creates a checkout session
     * @param {Object} params
     * @param {Array} params.items - List of items {id, name, price, quantity}
     * @param {string} params.currency - Currency code (e.g., 'BRL')
     * @returns {Promise<Object>} - The session data { sessionId, checkoutUrl, ... }
     */
    async createSession({ _items, _currency }) {
        throw new Error("Method 'createSession' must be implemented");
    }
}

// Mock Implementation for Development/Testing
class MockPaymentProvider extends PaymentProvider {
    async createSession({ items, currency }) {
        console.log('[MockPayment] Creating session for', items.length, 'items');

        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const randomId = Math.random().toString(36).substring(7);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return {
            sessionId: `sess_${randomId}`,
            provider: 'mock',
            status: 'pending',
            amount: totalAmount,
            currency,
            // In a real scenario, this would be the URL to redirect the user to
            checkoutUrl: `/checkout?session_id=sess_${randomId}&status=success`,
            clientSecret: `pi_${randomId}_secret`,
            qrCode: "00020126360014BR.GOV.BCB.PIX..." // Example for PIX
        };
    }
}

// Mercado Pago Implementation (Placeholder)
class MercadoPagoProvider extends PaymentProvider {
    async createSession({ _items, _currency }) {
        // TODO: Install 'mercadopago' SDK
        // import { MercadoPagoConfig, Preference } from 'mercadopago';
        // const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

        throw new Error("Mercado Pago provider is not fully configured yet. Please set up API keys.");
    }
}

/**
 * Factory function to get the active payment provider
 * Based on process.env.PAYMENT_PROVIDER
 */
export function getPaymentProvider() {
    const provider = process.env.PAYMENT_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'mercadopago':
            return new MercadoPagoProvider();
        case 'stripe':
            // return new StripeProvider();
            throw new Error("Stripe not implemented yet");
        case 'mock':
        default:
            if (provider !== 'mock') {
                console.warn(`[PaymentFactory] Provider '${provider}' not found, falling back to Mock.`);
            }
            return new MockPaymentProvider();
    }
}
