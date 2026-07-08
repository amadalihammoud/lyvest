/**
 * Shipping Service Abstraction
 *
 * Para adicionar um provider (ex.: Melhor Envio, Frenet):
 * 1. Crie uma classe que implemente ShippingProvider
 * 2. Implemente o calculate
 * 3. Adicione um case em getShippingProvider()
 */

import { logInfo } from '../../lib/server/logger';

import type { ShippingCalcOpts, ShippingOption, ShippingProvider } from './types';

// Mock.
class MockShippingProvider implements ShippingProvider {
    async calculate({ zipCode, items }: ShippingCalcOpts): Promise<ShippingOption[]> {
        logInfo('MockShipping: calculando frete', `CEP ${zipCode}, ${items.length} itens`);

        // Frete grátis se total > 300 (mock).
        const totalValue = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const isFreeShipping = totalValue >= 300;

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        return [
            {
                id: 'pac',
                carrier: 'Correios',
                service: 'PAC',
                price: isFreeShipping ? 0 : 25.5,
                originalPrice: 25.5,
                deliveryDays: 7,
                deliveryRange: '5 a 9 dias úteis',
                isFree: isFreeShipping,
            },
            {
                id: 'sedex',
                carrier: 'Correios',
                service: 'SEDEX',
                price: 45.9,
                originalPrice: 45.9,
                deliveryDays: 3,
                deliveryRange: '2 a 4 dias úteis',
                isFree: false,
            },
            {
                id: 'jadlog',
                carrier: 'Jadlog',
                service: '.Com',
                price: 19.9,
                originalPrice: 19.9,
                deliveryDays: 10,
                deliveryRange: '8 a 12 dias úteis',
                isFree: isFreeShipping,
            },
        ];
    }
}

// Melhor Envio (placeholder).
class MelhorEnvioProvider implements ShippingProvider {
    async calculate(_opts: ShippingCalcOpts): Promise<ShippingOption[]> {
        // TODO: integrar com a API do Melhor Envio (process.env.MELHOR_ENVIO_TOKEN).
        throw new Error('Melhor Envio provider is not fully configured yet.');
    }
}

/**
 * Factory do provider de frete ativo (process.env.SHIPPING_PROVIDER).
 */
export function getShippingProvider(): ShippingProvider {
    const provider = process.env.SHIPPING_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'melhorenvio':
            return new MelhorEnvioProvider();
        case 'frenet':
        case 'correios':
            throw new Error('Provider not implemented yet');
        case 'mock':
        default:
            return new MockShippingProvider();
    }
}
