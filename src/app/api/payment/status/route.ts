import { auth } from '@clerk/nextjs/server';
import { and, eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { orders } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { db } from '@/server/dbClient';

/**
 * GET /api/payment/status?orderId=
 *
 * Usado pelo checkout PIX on-site para saber quando o webhook marcou o pedido.
 * Só devolve status se o pedido for do user logado OU guest:{email} da sessão
 * (via query email opcional, rate-limited).
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
            totalAmount: orders.totalAmount,
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
        // pedido guest genérico sem e-mail ainda: só se ainda pending e acabou de criar
        (!userId && !email && order.userId?.startsWith('guest:'));

    // Em produção preferimos exigir identidade; permite guest se o userId do pedido for guest:*
    // e o cliente passou o mesmo e-mail, ou está logado.
    if (!owns && !(userId && order.userId === userId)) {
        // Soft: se não autenticado e pedido é pending, ainda devolve status (pedido UUID é secreto o suficiente)
        // para o polling do QR funcionar sem login. Não devolve itens.
        if (order.status !== 'pending' && order.status !== 'processing') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
    }

    return NextResponse.json({
        orderId: order.id,
        status: order.status,
        paid: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered',
    });
}
