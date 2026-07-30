import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { orders } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { db } from '@/server/dbClient';

/**
 * GET /api/payment/status?orderId=
 *
 * Polling do checkout PIX on-site: quando o webhook marca o pedido como pago,
 * a UI avança sem o cliente sair da página.
 */
const querySchema = z.object({
    orderId: z.string().uuid(),
    email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'api');
    if (!rl.success) {
        return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
        return NextResponse.json({ message: 'Invalid orderId' }, { status: 400 });
    }

    const { orderId, email } = parsed.data;
    const { userId } = await auth();

    const rows = await db
        .select({
            id: orders.id,
            status: orders.status,
            userId: orders.userId,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

    const order = rows[0];
    if (!order) {
        return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const guestKey = email ? `guest:${email.toLowerCase()}` : null;
    const owns =
        (userId && order.userId === userId) ||
        (guestKey && order.userId === guestKey) ||
        (!userId && order.userId?.startsWith('guest:'));

    if (!owns && order.status !== 'pending' && order.status !== 'processing') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
        orderId: order.id,
        status: order.status,
        paid: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered',
    });
}
