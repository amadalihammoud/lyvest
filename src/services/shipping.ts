
// src/services/shipping.ts
// Serviço para integração com transportadoras e rastreamento

import { SHIPPING_CONFIG } from '../config/constants';
import { shippingLogger } from '../utils/logger';

export interface ShippingOption {
    id: string;
    carrier: string;
    service: string;
    price: number;
    originalPrice: number;
    deliveryDays: number;
    deliveryRange: string;
    isFree: boolean;
}

export interface TrackingEvent {
    date: string;
    time: string;
    location: string;
    status: string;
    description: string;
}

export interface TrackingHistory {
    trackingCode: string;
    carrier: string;
    estimatedDelivery: string;
    status: string;
    events: TrackingEvent[];
}

export interface AddressData {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    ibge: string;
}

/**
 * Serviço de cálculo de frete e rastreamento
 */
export class ShippingService {
    // Carriers disponíveis: correios, jadlog, sedex

    /**
     * Calcula opções de frete
     * @param cep - CEP de destino
     * @param items - Itens do carrinho
     * @returns Opções de frete
     */
    async calculateShipping(cep: string, items: any[]): Promise<ShippingOption[]> {
        shippingLogger.debug('Calculando frete via API...', { cep, items });

        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            const response = await fetch('/api/shipping/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zipCode: cep, items })
            });

            if (!response.ok) {
                // Fallback específico para 404 local (simula sucesso)
                if (response.status === 404 && isLocalhost) {
                    console.warn('[DEV] API Shipping não encontrada (normal no Vite). Usando MOCK.');
                    await new Promise(r => setTimeout(r, 600)); // Delay simulado
                    return this._getMockShipping(cep, items);
                }
                throw new Error('Erro ao calcular frete no servidor');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Shipping Error:', error);
            // Em produção ou erro real, também usamos mock por segurança (ou exibiria erro)
            // Aqui mantemos o fallback para garantir UX fluida
            return this._getMockShipping(cep, items);
        }
    }

    private _getMockShipping(_cep: string, items: any[]): ShippingOption[] {
        const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const isFreeShipping = total >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;

        return [
            {
                id: 'pac',
                carrier: 'Correios',
                service: 'PAC (Fallback)',
                price: isFreeShipping ? 0 : SHIPPING_CONFIG.DEFAULT_SHIPPING_COST,
                originalPrice: SHIPPING_CONFIG.DEFAULT_SHIPPING_COST,
                deliveryDays: 7,
                deliveryRange: '5 a 9 dias úteis',
                isFree: isFreeShipping
            }
        ];
    }

    /**
     * Rastreia um pedido
     * @param trackingCode - Código de rastreamento
     * @returns Histórico de rastreamento
     */
    async trackOrder(trackingCode: string): Promise<TrackingHistory> {
        // Simulação - será substituído por integração real
        shippingLogger.info('Rastreando...', trackingCode);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simular histórico baseado no código
        const now = new Date();
        const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        return {
            trackingCode,
            carrier: 'Correios',
            estimatedDelivery: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'in_transit',
            events: [
                {
                    date: daysAgo(0).toISOString(),
                    time: '14:30',
                    location: 'São Paulo - SP',
                    status: 'in_transit',
                    description: 'Objeto em trânsito - por favor aguarde'
                },
                {
                    date: daysAgo(1).toISOString(),
                    time: '09:15',
                    location: 'Centro de Distribuição - SP',
                    status: 'processed',
                    description: 'Objeto encaminhado para a unidade de distribuição'
                },
                {
                    date: daysAgo(2).toISOString(),
                    time: '18:45',
                    location: 'São Paulo - SP',
                    status: 'posted',
                    description: 'Objeto postado'
                }
            ]
        };
    }

    /**
     * Valida CEP e retorna endereço
     * @param cep - CEP a validar
     * @returns Dados do endereço
     */
    async validateCep(cep: string): Promise<AddressData> {
        // Simulação - será substituído por ViaCEP ou similar
        shippingLogger.debug('Validando CEP...', cep);

        await new Promise(resolve => setTimeout(resolve, 500));

        // CEP inválido
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            throw new Error('CEP inválido');
        }

        // Simular resposta
        return {
            cep: cleanCep,
            street: 'Rua Exemplo',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            ibge: '3550308'
        };
    }

    /**
     * Verifica se o frete é grátis
     * @param total - Valor total do pedido
     * @returns boolean
     */
    isFreeShipping(total: number): boolean {
        return total >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
    }

    /**
     * Retorna valor mínimo para frete grátis
     * @returns number
     */
    getFreeShippingThreshold(): number {
        return SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
    }
}

// Instância singleton
export const shippingService = new ShippingService();
