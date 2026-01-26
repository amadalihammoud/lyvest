/* global process */
/**
 * ERP Stock Synchronization Webhook
 * POST /api/erp/webhook-stock
 * 
 * Receives real-time inventory updates from the ERP (Bling/Tiny).
 * Endpoint URL should be registered in the ERP's callback settings.
 */
export default async function handler(req, res) {
    // 1. Security Check: Validate Secret Token from ERP
    // Bling/Tiny usually send a secret token in headers or query params
    const incomingToken = req.headers['x-webhook-secret'] || req.query.token;

    if (incomingToken !== process.env.ERP_WEBHOOK_SECRET) {
        // Allow unauthenticated access ONLY in development/test environment if explicitly allowed
        if (process.env.NODE_ENV === 'production' || !process.env.ALLOW_UNSAFE_WEBHOOKS) {
            console.warn('[Stock Webhook] Unauthorized attempt:', req.socket.remoteAddress);
            return res.status(401).json({ error: 'Unauthorized' });
        }
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

        console.log(`[Stock Webhook] Received update for ${payload.sku}: ${payload.new_quantity}`);

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
        console.error('[Stock Webhook] Error processing update:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
