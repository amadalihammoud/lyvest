import { NextRequest, NextResponse } from 'next/server';

import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError, logInfo } from '@/lib/server/logger';

/**
 * POST /api/erp/webhook-stock
 *
 * Recebe atualizações de estoque do ERP (Bling/Tiny). Pilar 3: auth fail-closed
 * (tempo constante), sem log de IP.
 */
export async function POST(request: NextRequest) {
    // F4 da security-review: token só via header (nunca query-param, que vaza em access logs).
    const incomingToken = request.headers.get('x-webhook-secret') || '';

    if (!isAuthorizedInternal(incomingToken, process.env.ERP_WEBHOOK_SECRET ?? '')) {
        logError('erp/webhook-stock: tentativa não autorizada');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payload = await request.json();
        if (!payload || !payload.sku) {
            return NextResponse.json({ error: 'Invalid payload: SKU required' }, { status: 400 });
        }

        logInfo('erp/webhook-stock: update recebido para SKU', payload.sku);
        // TODO(Fase 3): atualização/decremento atômico de estoque via RPC decrement_stock.

        return NextResponse.json({
            success: true,
            message: `Stock updated for ${payload.sku}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logError('erp/webhook-stock: erro ao processar update', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
