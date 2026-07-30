import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { orders } from '@/db/schema';
import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError, logInfo } from '@/lib/server/logger';
import { db } from '@/server/dbClient';
import { getErpProvider } from '@/server/providers/erp';

/**
 * POST|GET /api/internal/sync-erp-orders
 *
 * Reenvia ao ERP pedidos `processing` sem `erp_order_id` (falha anterior do Bling).
 * Auth: Bearer INTERNAL_API_KEY ou x-vercel-cron.
 */
export const maxDuration = 60;

const MAX_BATCH = 20;

function isCronOrInternal(request: NextRequest): boolean {
    if (request.headers.get('x-vercel-cron')) return true;
    const authHeader = request.headers.get('authorization') ?? '';
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return false;
    return isAuthorizedInternal(authHeader, `Bearer ${internalKey}`);
}

export async function POST(request: NextRequest) {
    if (!isCronOrInternal(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const pending = await db
            .select({ id: orders.id })
            .from(orders)
            .where(and(eq(orders.status, 'processing'), isNull(orders.erpOrderId)))
            .limit(MAX_BATCH);

        const erp = getErpProvider();
        let ok = 0;
        let fail = 0;

        for (const row of pending) {
            const result = await erp.sendOrder({ id: row.id });
            if (result.success) ok++;
            else fail++;
        }

        logInfo('sync-erp-orders: lote', { found: pending.length, ok, fail });

        return NextResponse.json({
            success: true,
            found: pending.length,
            ok,
            fail,
        });
    } catch (e) {
        logError('sync-erp-orders: falha', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
