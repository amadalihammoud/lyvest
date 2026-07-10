/**
 * Shipping Provider Abstraction
 *
 * Gerencia o cálculo de frete.
 * Para adicionar um provider (ex.: Melhor Envio, Frenet):
 * 1. Crie uma classe que estenda ShippingProvider
 * 2. Implemente o método calculate
 * 3. Adicione um case em getShippingProvider()
 */

import { logInfo } from '../../lib/server/logger';

import { getFreeShippingThreshold } from '../financialConfig';

export interface ShippingItem {
    id: string | number;
    quantity: number;
    price: number;
    width?: number;
    height?: number;
    length?: number;
    weight?: number;
}

export interface ShippingQuote {
    id: string;
    carrier: string;
    service: string;
    price: number;
    originalPrice: number;
    deliveryDays: number;
    deliveryRange: string;
    isFree: boolean;
}

export interface CalculateParams {
    zipCode: string;
    items: ShippingItem[];
}

// Classe base (interface)
abstract class ShippingProvider {
    abstract calculate(params: CalculateParams): Promise<ShippingQuote[]>;
}

// Implementação Mock (desenvolvimento/testes)
class MockShippingProvider extends ShippingProvider {
    async calculate({ zipCode, items }: CalculateParams): Promise<ShippingQuote[]> {
        logInfo('MockShipping: calculando frete', `CEP ${zipCode}, ${items.length} itens`);

        // Frete grátis a partir do limite único, lido do banco (financial_configs) com
        // fallback para a constante — mesmo valor que o carrinho promete ao cliente.
        const freeShippingThreshold = await getFreeShippingThreshold();
        const totalValue = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const isFreeShipping = totalValue >= freeShippingThreshold;

        // Simula latência de rede
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

// Implementação Melhor Envio (placeholder)
class MelhorEnvioProvider extends ShippingProvider {
    async calculate(_params: CalculateParams): Promise<ShippingQuote[]> {
        // TODO: integrar com a API do Melhor Envio (process.env.MELHOR_ENVIO_TOKEN)
        throw new Error('Melhor Envio provider is not fully configured yet.');
    }
}

/** Factory: retorna o provider de frete ativo (process.env.SHIPPING_PROVIDER). */
export function getShippingProvider(): ShippingProvider {
    const provider = process.env.SHIPPING_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'melhorenvio':
            return new MelhorEnvioProvider();
        case 'frenet':
        case 'correios':
            // return new CorreiosProvider();
            throw new Error('Provider not implemented yet');
        case 'mock':
        default:
            return new MockShippingProvider();
    }
}
