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
import { sendOrderFromErpData } from '../bling/sendOrder';

/** Pedido enviado ao ERP — no mínimo o id local do pedido. */
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

abstract class ErpProvider {
    abstract sendOrder(orderData: ErpOrderData): Promise<ErpSyncResult>;
}

class MockErpProvider extends ErpProvider {
    async sendOrder(orderData: ErpOrderData): Promise<ErpSyncResult> {
        logInfo('MockERP: sincronizando pedido', orderData.id);
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
            success: true,
            provider: 'mock',
            erpReferenceId: `erp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            message: 'Pedido integrado com sucesso (Simulado)',
        };
    }
}

/** Bling: POST /pedidos/vendas a partir do snapshot do pedido no Neon. */
class BlingProvider extends ErpProvider {
    async sendOrder(orderData: ErpOrderData): Promise<ErpSyncResult> {
        return sendOrderFromErpData(orderData);
    }
}

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

/** Dispara sync sem derrubar o webhook se o ERP falhar. */
export async function syncOrderToErpBestEffort(orderId: string): Promise<void> {
    try {
        const result = await getErpProvider().sendOrder({ id: orderId });
        logInfo('erp: sync pedido', { orderId, ...result });
    } catch (e) {
        // Nunca propaga: pagamento já confirmado; retry via job interno.
        logInfo('erp: sync falhou (best-effort)', {
            orderId,
            error: e instanceof Error ? e.message : String(e),
        });
    }
}
