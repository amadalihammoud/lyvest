import { and, eq, lt, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { orders } from '@/db/schema';
import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError, logInfo } from '@/lib/server/logger';
import { db } from '@/server/dbClient';
import { cancelPendingOrderDb } from '@/server/orderDb';

/**
 * POST /api/internal/expire-pending-orders
 *
 * Cancela pedidos 'pending' mais antigos que PENDING_ORDER_TTL_HOURS (default 2),
 * restaurando estoque e liberando cupom via cancel_pending_order.
 *
 * Auth: Authorization: Bearer INTERNAL_API_KEY (ou header x-vercel-cron em cron Vercel).
 * Agendar em vercel.json: a cada 15–30 min.
 */
export const maxDuration = 60;

const DEFAULT_TTL_HOURS = 2;
const MAX_BATCH = 50;

function isCronOrInternal(request: NextRequest): boolean {
    // Vercel Cron envia este header automaticamente em crons configurados.
    const vercelCron = request.headers.get('x-vercel-cron');
    if (vercelCron) return true;

    const authHeader = request.headers.get('authorization') ?? '';
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return false;
    return isAuthorizedInternal(authHeader, `Bearer ${internalKey}`);
}

export async function POST(request: NextRequest) {
    if (!isCronOrInternal(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ttlHours = Math.max(
        1,
        Number(process.env.PENDING_ORDER_TTL_HOURS) || DEFAULT_TTL_HOURS
    );

    try {
        const cutoff = sql`NOW() - (${ttlHours} || ' hours')::interval`;

        const stale = await db
            .select({ id: orders.id, couponCode: orders.couponCode })
            .from(orders)
            .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoff as unknown as Date)))
            .limit(MAX_BATCH);

        // Fallback se o driver não aceitar sql no lt: usar Date JS.
        // (Drizzle + neon costuma aceitar; se a query acima falhar, o catch cobre.)

        let cancelled = 0;
        let failed = 0;

        for (const row of stale) {
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
        // Retry com Date puro se a expressão SQL falhar em algum driver.
        try {
            const ttlHours = Math.max(
                1,
                Number(process.env.PENDING_ORDER_TTL_HOURS) || DEFAULT_TTL_HOURS
            );
            const cutoffDate = new Date(Date.now() - ttlHours * 60 * 60 * 1000);

            const stale = await db
                .select({ id: orders.id, couponCode: orders.couponCode })
                .from(orders)
                .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoffDate)))
                .limit(MAX_BATCH);

            let cancelled = 0;
            let failed = 0;
            for (const row of stale) {
                const ok = await cancelPendingOrderDb(row.id, row.couponCode ?? null);
                if (ok) cancelled++;
                else failed++;
            }

            logInfo('expire-pending-orders: lote processado (fallback Date)', {
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
        } catch (e2) {
            logError('expire-pending-orders: falha', e2 ?? e);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    }
}

/** GET também aceito para cron simples / health check autenticado. */
export async function GET(request: NextRequest) {
    return POST(request);
}
