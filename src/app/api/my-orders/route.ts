import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { orders } from '@/db/schema';
import { logError } from '@/lib/server/logger';
import { db } from '@/server/dbClient';

/**
 * GET /api/my-orders — pedidos do usuário logado (substitui a query direta do
 * browser via supabase-js/RLS). Escopo: WHERE user_id = <Clerk auth()>.
 */
export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    try {
        const rows = await db
            .select({
                id: orders.id,
                created_at: orders.createdAt,
                status: orders.status,
                total_amount: orders.totalAmount,
                payment_method: orders.paymentMethod,
                tracking_code: orders.trackingCode,
                shipping_address: orders.shippingAddress,
                items: orders.items,
            })
            .from(orders)
            .where(eq(orders.userId, userId))
            .orderBy(desc(orders.createdAt));

        return NextResponse.json({ orders: rows });
    } catch (e) {
        logError('my-orders: erro ao listar', e);
        return NextResponse.json({ message: 'Erro ao carregar pedidos' }, { status: 500 });
    }
}
