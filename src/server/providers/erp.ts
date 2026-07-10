/**
 * ERP Provider Abstraction
 *
 * Gerencia a sincronização de pedidos com sistemas ERP.
 * Para adicionar um provider (ex.: Bling, Tiny):
 * 1. Crie uma classe que estenda ErpProvider
 * 2. Implemente o método sendOrder
 * 3. Adicione um case em getErpProvider()
 */

import { logInfo } from '../../lib/server/logger';

/** Pedido enviado ao ERP (shape flexível — o contrato duro é do ERP de destino). */
export interface ErpOrderData {
    id?: string | number;
    [key: string]: unknown;
}

export interface ErpSyncResult {
    success: boolean;
    provider: string;
    erpReferenceId: string;
    message: string;
}

// Classe base (interface)
abstract class ErpProvider {
    abstract sendOrder(orderData: ErpOrderData): Promise<ErpSyncResult>;
}

// Implementação Mock (desenvolvimento/testes)
class MockErpProvider extends ErpProvider {
    async sendOrder(orderData: ErpOrderData): Promise<ErpSyncResult> {
        logInfo('MockERP: sincronizando pedido', orderData.id);

        // Simula latência de rede
        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
            success: true,
            provider: 'mock',
            erpReferenceId: `erp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            message: 'Pedido integrado com sucesso (Simulado)',
        };
    }
}

// Implementação Bling (placeholder)
class BlingProvider extends ErpProvider {
    async sendOrder(_orderData: ErpOrderData): Promise<ErpSyncResult> {
        // TODO: transformar orderData no XML/JSON exigido pelo Bling
        // TODO: POST em process.env.BLING_API_URL
        throw new Error('Bling provider is not fully configured yet.');
    }
}

/** Factory: retorna o provider de ERP ativo (process.env.ERP_PROVIDER). */
export function getErpProvider(): ErpProvider {
    const provider = process.env.ERP_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'bling':
            return new BlingProvider();
        case 'tiny':
            // return new TinyProvider();
            throw new Error('Tiny ERP not implemented yet');
        case 'mock':
        default:
            return new MockErpProvider();
    }
}
