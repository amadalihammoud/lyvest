import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { createServerSupabaseClient } from '@/lib/server/supabaseServer';

/**
 * POST /api/reviews
 *
 * Cria uma avaliação de produto. Substitui o insert direto do cliente (que era
 * auto-aprovado e sem verificação de compra) por um fluxo server-side:
 *
 *  - Pilar 3: exige usuário logado (auth no servidor); o user_id vem do token, não do body.
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
        const { userId, getToken } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
        }
        const { productId, productName, orderId, rating, comment } = parsed.data;

        const token = await getToken();
        const supabase = createServerSupabaseClient(token);

        // Verificação de compra: busca os pedidos do usuário (RLS já escopa por user_id)
        // e confere que algum deles contém o produto avaliado.
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, items')
            .eq('user_id', userId);

        if (ordersError) {
            logError('reviews: erro ao verificar pedidos', ordersError);
            return NextResponse.json({ message: 'Não foi possível validar a compra' }, { status: 500 });
        }

        if (!orders || !purchasedProduct(orders as OrderRow[], productId, productName)) {
            return NextResponse.json(
                { message: 'Só é possível avaliar produtos que você comprou.' },
                { status: 403 }
            );
        }

        // Grava para moderação (approved=false). user_id vem do token (não do cliente).
        const { error: insertError } = await supabase.from('reviews').insert({
            user_id: userId,
            order_id: orderId,
            product_id: productId ?? null,
            product_name: productName,
            rating,
            comment,
            approved: false,
        });

        if (insertError) {
            logError('reviews: erro ao inserir avaliação', insertError);
            return NextResponse.json({ message: 'Erro ao enviar avaliação' }, { status: 500 });
        }

        return NextResponse.json({ success: true, moderated: true });
    } catch (error) {
        logError('reviews: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
