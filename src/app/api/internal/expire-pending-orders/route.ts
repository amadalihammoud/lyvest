import { and, eq, lt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { orders } from '@/db/schema';
import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError, logInfo } from '@/lib/server/logger';
import { db } from '@/server/dbClient';
import { cancelPendingOrderDb } from '@/server/orderDb';

/**
 * POST|GET /api/internal/expire-pending-orders
 *
 * Cancela pedidos 'pending' mais antigos que PENDING_ORDER_TTL_HOURS (default 2),
 * restaurando estoque e liberando cupom via cancel_pending_order.
 *
 * Auth: Authorization: Bearer INTERNAL_API_KEY, ou header x-vercel-cron (Cron Vercel).
 */
export const maxDuration = 60;

const DEFAULT_TTL_HOURS = 2;
const MAX_BATCH = 50;

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

    const ttlHours = Math.max(1, Number(process.env.PENDING_ORDER_TTL_HOURS) || DEFAULT_TTL_HOURS);
    const cutoffDate = new Date(Date.now() - ttlHours * 60 * 60 * 1000);

    try {
        const stale = await db
            .select({ id: orders.id, couponCode: orders.couponCode })
            .from(orders)
            .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoffDate)))
            .limit(MAX_BATCH);

        let cancelled = 0;
        let failed = 0;

        for (const row of stale) {
            // coupon_code no pedido (migração 0009) torna o 2º arg opcional;
            // passamos mesmo assim para compatibilidade com cancel antigo.
            const ok = await cancelPendingOrderDb(row.id, row.couponCode ?? null);
            if (ok) cancelled++;
            else failed++;
        }

        logInfo('expire-pending-orders: lote processado', {
            found: stale.length,
            cancelled,
            failed,
            ttlHours,
        });

        return NextResponse.json({
            success: true,
            found: stale.length,
            cancelled,
            failed,
            ttlHours,
        });
    } catch (e) {
        logError('expire-pending-orders: falha', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
