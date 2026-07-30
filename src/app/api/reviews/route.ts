import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { orders as ordersTable, reviews } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { db } from '@/server/dbClient';

/**
 * POST /api/reviews
 *
 * - Identidade: Clerk auth() (nunca do body)
 * - productId obrigatório (UUID) — sem match por nome (bypass)
 * - orderId deve ser pedido do usuário em status pago (processing|shipped|delivered)
 * - productId deve constar nos items daquele pedido
 * - approved=false (moderação)
 */
const bodySchema = z.object({
    productId: z.string().uuid(),
    productName: z.string().min(1).max(200).optional(),
    orderId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional().default(''),
});

const PAID_STATUSES = ['processing', 'shipped', 'delivered'] as const;

function orderContainsProduct(items: unknown, productId: string): boolean {
    if (!Array.isArray(items)) return false;
    return items.some((raw) => {
        const item = (raw ?? {}) as Record<string, unknown>;
        return String(item.id) === productId;
    });
}

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'form');
    if (!rl.success) {
        return NextResponse.json(
            { message: 'Muitas requisições. Tente novamente em instantes.' },
            { status: 429 }
        );
    }

    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
        }
        const { productId, productName, orderId, rating, comment } = parsed.data;

        let order: { id: string; status: string | null; items: unknown } | undefined;
        try {
            const rows = await db
                .select({
                    id: ordersTable.id,
                    status: ordersTable.status,
                    items: ordersTable.items,
                })
                .from(ordersTable)
                .where(
                    and(
                        eq(ordersTable.id, orderId),
                        eq(ordersTable.userId, userId),
                        inArray(ordersTable.status, [...PAID_STATUSES])
                    )
                )
                .limit(1);
            order = rows[0];
        } catch (ordersError) {
            logError('reviews: erro ao verificar pedido', ordersError);
            return NextResponse.json({ message: 'Não foi possível validar a compra' }, { status: 500 });
        }

        if (!order) {
            return NextResponse.json(
                { message: 'Pedido não encontrado ou ainda não pago.' },
                { status: 403 }
            );
        }

        if (!orderContainsProduct(order.items, productId)) {
            return NextResponse.json(
                { message: 'Só é possível avaliar produtos deste pedido.' },
                { status: 403 }
            );
        }

        try {
            await db.insert(reviews).values({
                userId,
                orderId,
                productId,
                productName: productName ?? null,
                rating,
                comment,
                approved: false,
            });
        } catch (insertError) {
            logError('reviews: erro ao inserir avaliação', insertError);
            return NextResponse.json({ message: 'Erro ao enviar avaliação' }, { status: 500 });
        }

        return NextResponse.json({ success: true, moderated: true });
    } catch (error) {
        logError('reviews: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
