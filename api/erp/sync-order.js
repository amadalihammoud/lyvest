/* global process */
/**
 * ERP Sync Endpoint
 * POST /api/erp/sync-order
 * 
 * Synchronizes confirmed orders with the ERP system (Bling/Tiny).
 * Usually triggered by a webhook or internal process.
 */
import { getErpProvider } from '../_services/erp'

/**
 * ERP Sync Endpoint
 * POST /api/erp/sync-order
 */
export default async function handler(req, res) {
    // Security Check: Ensure the request comes from an authorized source
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
        // Allow if in development for testing
        if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const orderData = req.body;

        // Delegate to active ERP Provider (Bling, Tiny, Mock)
        const erpProvider = getErpProvider();
        const result = await erpProvider.sendOrder(orderData);

        return res.status(200).json(result);

    } catch (error) {
        console.error('ERP Sync Error:', error);
        return res.status(500).json({
            error: 'Erro ao sincronizar com ERP',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
