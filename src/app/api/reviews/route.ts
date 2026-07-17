import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { orders as ordersTable, reviews } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { db } from '@/server/dbClient';

/**
 * POST /api/reviews
 *
 * Cria uma avaliação de produto. Fluxo server-side (Neon/Drizzle):
 *
 *  - Pilar 3: exige usuário logado (auth no servidor); o user_id vem do token, não do body.
 *    Sem RLS: o escopo por usuário é o WHERE user_id = <Clerk id> aplicado AQUI.
 *  - Verificação de compra: só permite avaliar produto que o usuário realmente comprou
 *    (existe um pedido dele contendo o produto).
 *  - Moderação: grava com approved=false (nunca auto-aprova) — evita review injection.
 *  - Pilar 4: rate limit. Pilar 5: validação Zod.
 */
const bodySchema = z.object({
    productId: z.string().uuid().optional(),
    productName: z.string().min(1).max(200),
    orderId: z.string().min(1).max(64),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional().default(''),
});

type OrderRow = { id: string; items: unknown };

// Confere se algum pedido do usuário contém o produto avaliado (por id ou nome).
function purchasedProduct(orders: OrderRow[], productId?: string, productName?: string): boolean {
    return orders.some((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return items.some((raw) => {
            const item = (raw ?? {}) as Record<string, unknown>;
            const idMatch = productId != null && String(item.id) === String(productId);
            const nameMatch =
                productName != null &&
                typeof item.name === 'string' &&
                item.name.trim().toLowerCase() === productName.trim().toLowerCase();
            return idMatch || nameMatch;
        });
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
        // Pilar 3: identidade vem do servidor, nunca do corpo da requisição.
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
        }
        const { productId, productName, orderId, rating, comment } = parsed.data;

        // Verificação de compra: busca os pedidos do usuário (escopo aplicado no WHERE)
        // e confere que algum deles contém o produto avaliado.
        let userOrders: OrderRow[];
        try {
            userOrders = await db
                .select({ id: ordersTable.id, items: ordersTable.items })
                .from(ordersTable)
                .where(eq(ordersTable.userId, userId));
        } catch (ordersError) {
            logError('reviews: erro ao verificar pedidos', ordersError);
            return NextResponse.json({ message: 'Não foi possível validar a compra' }, { status: 500 });
        }

        if (!purchasedProduct(userOrders, productId, productName)) {
            return NextResponse.json(
                { message: 'Só é possível avaliar produtos que você comprou.' },
                { status: 403 }
            );
        }

        // Grava para moderação (approved=false). user_id vem do token (não do cliente).
        try {
            await db.insert(reviews).values({
                userId,
                orderId,
                productId: productId ?? null,
                productName,
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
