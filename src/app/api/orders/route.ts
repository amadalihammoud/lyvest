import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { createOrderDb } from '@/server/orderDb';
import { couponRuleFor, messageForRpcError } from '@/server/orders';

/**
 * POST /api/orders
 *
 * Persiste um pedido de forma ATÔMICA e server-authoritative, via a função SQL
 * create_order (Neon):
 *  - Pilar 1: o cliente manda só id + quantidade (+ código do cupom). Preço e total são
 *    recomputados no banco. Qualquer total/desconto do cliente é ignorado.
 *  - Pilar 2: baixa de estoque condicional/atômica e cupom de uso único (constraint UNIQUE)
 *    dentro da mesma transação da função.
 *  - Pilar 3: exige usuário logado; a identidade vem do Clerk (auth()) AQUI no servidor
 *    e é passada como parâmetro — o cliente nunca escolhe o user_id.
 *  - Pilar 4: rate limit. Pilar 5: validação Zod + erros sem vazar detalhe interno.
 */
const bodySchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().uuid(),
                quantity: z.number().int().positive().max(99),
            })
        )
        .min(1, { message: 'Cart cannot be empty' })
        .max(50),
    couponCode: z.string().min(1).max(32).optional(),
    paymentMethod: z.enum(['credit', 'pix']).optional(),
    shipping: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'checkout');
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
        const { items, couponCode, paymentMethod, shipping } = parsed.data;
        const coupon = couponRuleFor(couponCode);

        try {
            const data = await createOrderDb({
                userId,
                items,
                couponCode: coupon.code,
                discount: coupon.discount,
                singleUse: coupon.singleUse,
                minCartTotal: coupon.minCartTotal,
                paymentMethod: paymentMethod ?? 'unknown',
                shipping: shipping ?? null,
            });
            return NextResponse.json({ success: true, data });
        } catch (dbError) {
            const msg = dbError instanceof Error ? dbError.message : String(dbError);
            const mapped = messageForRpcError(msg);
            if (mapped.status >= 500) logError('orders: create_order falhou', dbError);
            return NextResponse.json({ message: mapped.message }, { status: mapped.status });
        }
    } catch (error) {
        logError('orders: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
