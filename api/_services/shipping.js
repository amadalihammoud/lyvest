/**
 * Shipping Service Abstraction
 * 
 * This service manages shipping rate calculations.
 * To add a new provider (e.g., Melhor Envio, Frenet):
 * 1. Create a class that extends ShippingProvider
 * 2. Implement the calculate method
 * 3. Add a case in getShippingProvider()
 */

// Base Class (Interface)
class ShippingProvider {
    /**
     * Calculates shipping rates
     * @param {Object} params
     * @param {string} params.zipCode - Destination ZIP code
     * @param {Array} params.items - List of items {id, width, height, length, weight, quantity, price}
     * @returns {Promise<Array>} - List of shipping options
     */
    async calculate({ _zipCode, _items }) {
        throw new Error("Method 'calculate' must be implemented");
    }
}

// Mock Implementation
class MockShippingProvider extends ShippingProvider {
    async calculate({ zipCode, items }) {
        console.log(`[MockShipping] Calculating for CEP: ${zipCode}, Items: ${items.length}`);

        // Logic currently used in the mock:
        // Free shipping if total > 300
        const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const isFreeShipping = totalValue >= 300;

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));

        return [
            {
                id: 'pac',
                carrier: 'Correios',
                service: 'PAC',
                price: isFreeShipping ? 0 : 25.50,
                originalPrice: 25.50,
                deliveryDays: 7,
                deliveryRange: '5 a 9 dias úteis',
                isFree: isFreeShipping
            },
            {
                id: 'sedex',
                carrier: 'Correios',
                service: 'SEDEX',
                price: 45.90,
                originalPrice: 45.90,
                deliveryDays: 3,
                deliveryRange: '2 a 4 dias úteis',
                isFree: false
            },
            {
                id: 'jadlog',
                carrier: 'Jadlog',
                service: '.Com',
                price: 19.90,
                originalPrice: 19.90,
                deliveryDays: 10,
                deliveryRange: '8 a 12 dias úteis',
                isFree: isFreeShipping
            }
        ];
    }
}

// Melhor Envio Implementation (Placeholder)
class MelhorEnvioProvider extends ShippingProvider {
    async calculate({ _zipCode, _items }) {
        // TODO: Implement interaction with Melhor Envio API
        // Requires: process.env.MELHOR_ENVIO_TOKEN
        throw new Error("Melhor Envio provider is not fully configured yet.");
    }
}

/**
 * Factory function to get the active shipping provider
 */
export function getShippingProvider() {
    const provider = process.env.SHIPPING_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'melhorenvio':
            return new MelhorEnvioProvider();
        case 'frenet':
        case 'correios':
            // return new CorreiosProvider();
            throw new Error("Provider not implemented yet");
        case 'mock':
        default:
            return new MockShippingProvider();
    }
}
