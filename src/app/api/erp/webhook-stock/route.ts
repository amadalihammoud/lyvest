import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { products } from '@/db/schema';
import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError, logInfo } from '@/lib/server/logger';
import { db } from '@/server/dbClient';

/**
 * POST /api/erp/webhook-stock
 *
 * Recebe atualizações de estoque do ERP (Bling). Auth fail-closed via
 * x-webhook-secret (ERP_WEBHOOK_SECRET). Aceita formatos:
 *  - Bling v3 (evento de estoque): { data: { produto: { id }, saldoVirtualTotal } }
 *  - Genérico: { blingId | idProduto, saldo | quantity }
 * Atualiza products.stock de forma ABSOLUTA (o ERP é a fonte da verdade do
 * saldo), localizando o produto por bling_id.
 */
export async function POST(request: NextRequest) {
    const url = new URL(request.url);
    const incomingToken =
        request.headers.get('x-webhook-secret') || url.searchParams.get('token') || '';

    if (!isAuthorizedInternal(incomingToken, process.env.ERP_WEBHOOK_SECRET ?? '')) {
        logError('erp/webhook-stock: tentativa não autorizada');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payload = await request.json();
        const d = payload?.data ?? payload ?? {};

        const blingId = Number(d?.produto?.id ?? d?.blingId ?? d?.idProduto ?? NaN);
        const saldoRaw = d?.saldoVirtualTotal ?? d?.saldo ?? d?.quantity;
        const saldo = Number(saldoRaw);

        if (!Number.isFinite(blingId) || !Number.isFinite(saldo)) {
            return NextResponse.json(
                { error: 'Invalid payload: blingId/idProduto e saldo são obrigatórios' },
                { status: 400 }
            );
        }

        const updated = await db
            .update(products)
            .set({ stock: Math.max(0, Math.trunc(saldo)) })
            .where(eq(products.blingId, blingId))
            .returning({ id: products.id, name: products.name });

        if (updated.length === 0) {
            // Produto ainda não sincronizado — não é erro (o sync de catálogo resolve).
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
