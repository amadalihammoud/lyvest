/* global process */
/* eslint-disable no-unused-vars */
/**
 * ERP Service Abstraction
 * 
 * This service manages synchronization with ERP systems.
 * To add a new provider (e.g., Bling, Tiny):
 * 1. Create a class that extends ErpProvider
 * 2. Implement the sendOrder method
 */

// Base Class (Interface)
class ErpProvider {
    /**
     * Sends an order to the ERP
     * @param {Object} orderData - The full order object
     * @returns {Promise<Object>} - Confirmation data from ERP
     */
    async sendOrder(_orderData) {
        throw new Error("Method 'sendOrder' must be implemented");
    }
}

// Mock Implementation
class MockErpProvider extends ErpProvider {
    async sendOrder(orderData) {
        console.log('[MockERP] Syncing order:', orderData.id);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            provider: 'mock',
            erpReferenceId: `erp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            message: 'Pedido integrado com sucesso (Simulado)'
        };
    }
}

// Bling Implementation (Placeholder)
class BlingProvider extends ErpProvider {
    async sendOrder(_orderData) {
        // TODO: Transform 'orderData' to XML/JSON required by Bling
        // TODO: Axios.post(process.env.BLING_API_URL, ...)
        throw new Error("Bling provider is not fully configured yet.");
    }
}

/**
 * Factory function to get the active ERP provider
 */
export function getErpProvider() {
    const provider = process.env.ERP_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'bling':
            return new BlingProvider();
        case 'tiny':
            // return new TinyProvider();
            throw new Error("Tiny ERP not implemented yet");
        case 'mock':
        default:
            return new MockErpProvider();
    }
}
