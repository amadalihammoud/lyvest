/* global process */
/**
 * ERP Stock Synchronization Webhook
 * POST /api/erp/webhook-stock
 * 
 * Receives real-time inventory updates from the ERP (Bling/Tiny).
 * Endpoint URL should be registered in the ERP's callback settings.
 */
import { isAuthorizedInternal } from '../_utils/internalAuth'
import { logError, logInfo } from '../_utils/logger'

export default async function handler(req, res) {
    // 1. Security Check: fail-closed, comparação em tempo constante.
    // Bling/Tiny enviam um token secreto em header ou query param.
    const incomingToken = req.headers['x-webhook-secret'] || req.query.token;

    if (!isAuthorizedInternal(incomingToken, process.env.ERP_WEBHOOK_SECRET)) {
        logError('erp/webhook-stock: tentativa não autorizada');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;

        // Example Payload Structure (will vary by ERP):
        // {
        //   "type": "stock_update",
        //   "sku": "SKU-123",
        //   "new_quantity": 50,
        //   "warehouse_id": 12345
        // }

        if (!payload || !payload.sku) {
            return res.status(400).json({ error: 'Invalid payload: SKU required' });
        }

        logInfo(`erp/webhook-stock: update recebido para SKU ${payload.sku}`, payload.new_quantity);

        // TODO: Database Update Logic
        // 1. Find product by SKU in your Database (Postgres/Supabase)
        // 2. Update stock_quantity field
        // 3. Revalidate Static Pages (ISR) if using Next.js, or just update DB for next fetch

        // Mocking successful update for now
        return res.status(200).json({
            success: true,
            message: `Stock updated for ${payload.sku}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logError('erp/webhook-stock: erro ao processar update', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
