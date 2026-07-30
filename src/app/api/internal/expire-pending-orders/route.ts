import { NextRequest, NextResponse } from 'next/server';

import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError } from '@/lib/server/logger';
import { expireStalePendingOrders } from '@/server/orderService';

/**
 * POST|GET /api/internal/expire-pending-orders
 * Auth: Bearer INTERNAL_API_KEY ou x-vercel-cron.
 */
export const maxDuration = 60;

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
        const result = await expireStalePendingOrders();
        return NextResponse.json({ success: true, ...result });
    } catch (e) {
        logError('expire-pending-orders: falha', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
