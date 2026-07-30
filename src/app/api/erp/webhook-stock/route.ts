import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { products } from '@/db/schema';
import { isErpStockAuthoritative } from '@/lib/server/erpFlags';
import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError, logInfo } from '@/lib/server/logger';
import { parseStockEvent } from '@/server/bling/stockEvent';
import { db } from '@/server/dbClient';

/**
 * POST /api/erp/webhook-stock
 *
 * Recebe atualizações de estoque do ERP (Bling). Auth fail-closed via
 * header `x-webhook-secret` (ERP_WEBHOOK_SECRET) — NÃO aceita token na query
 * string (vazaria em logs de proxy/CDN).
 *
 * Atualiza products.stock de forma ABSOLUTA quando ERP_STOCK_AUTHORITATIVE=1.
 */
export async function POST(request: NextRequest) {
    const incomingToken = request.headers.get('x-webhook-secret') || '';

    if (!isAuthorizedInternal(incomingToken, process.env.ERP_WEBHOOK_SECRET ?? '')) {
        logError('erp/webhook-stock: tentativa não autorizada');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const evento = parseStockEvent(await request.json());

        if (!evento) {
            return NextResponse.json(
                { error: 'Invalid payload: blingId/idProduto e saldo são obrigatórios' },
                { status: 400 }
            );
        }

        const { blingId, saldo } = evento;

        if (!isErpStockAuthoritative()) {
            logInfo('erp/webhook-stock: ignorado (ERP_STOCK_AUTHORITATIVE desligado)', {
                blingId,
                saldo,
            });
            return NextResponse.json({ success: true, skipped: 'erp-stock-not-authoritative' });
        }

        const updated = await db
            .update(products)
            .set({ stock: saldo })
            .where(eq(products.blingId, blingId))
            .returning({ id: products.id, name: products.name });

        if (updated.length === 0) {
            logInfo('erp/webhook-stock: bling_id sem produto local (ignorado)', blingId);
            return NextResponse.json({ success: true, matched: false });
        }

        logInfo('erp/webhook-stock: estoque atualizado', { produto: updated[0].name, saldo });
        return NextResponse.json({ success: true, matched: true });
    } catch (error) {
        logError('erp/webhook-stock: erro ao processar update', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
