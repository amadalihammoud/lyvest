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
        // Interpretação do payload vive em ./stockEvent (pura e testada):
        // tolera os dois formatos do Bling e rejeita os casos degenerados que o
        // `Number()` cru deixava passar — null e string vazia viravam 0 e
        // zerariam o estoque a partir de um payload quase vazio.
        const evento = parseStockEvent(await request.json());

        if (!evento) {
            return NextResponse.json(
                { error: 'Invalid payload: blingId/idProduto e saldo são obrigatórios' },
                { status: 400 }
            );
        }

        const { blingId, saldo } = evento;

        // Enquanto o pedido pago não for sincronizado com o Bling, o saldo de lá
        // ignora as vendas do site — gravá-lo aqui apagaria as baixas do checkout.
        // Ver src/lib/server/erpFlags.ts. Responde 200 para o Bling não reenviar.
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
