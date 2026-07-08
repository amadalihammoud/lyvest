/**
 * ERP Service Abstraction
 *
 * Para adicionar um provider (ex.: Bling, Tiny):
 * 1. Crie uma classe que implemente ErpProvider
 * 2. Implemente o sendOrder
 */

import { logInfo } from '../../lib/server/logger';

import type { ErpProvider, ErpResult } from './types';

// Mock.
class MockErpProvider implements ErpProvider {
    async sendOrder(orderData: Record<string, unknown>): Promise<ErpResult> {
        logInfo('MockERP: sincronizando pedido', orderData.id);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
            success: true,
            provider: 'mock',
            erpReferenceId: `erp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            message: 'Pedido integrado com sucesso (Simulado)',
        };
    }
}

// Bling (placeholder).
class BlingProvider implements ErpProvider {
    async sendOrder(_orderData: Record<string, unknown>): Promise<ErpResult> {
        // TODO: transformar orderData no formato do Bling + POST (process.env.BLING_API_URL).
        throw new Error('Bling provider is not fully configured yet.');
    }
}

/**
 * Factory do provider de ERP ativo (process.env.ERP_PROVIDER).
 */
export function getErpProvider(): ErpProvider {
    const provider = process.env.ERP_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'bling':
            return new BlingProvider();
        case 'tiny':
            throw new Error('Tiny ERP not implemented yet');
        case 'mock':
        default:
            return new MockErpProvider();
    }
}
