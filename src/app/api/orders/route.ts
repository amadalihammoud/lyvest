import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { createOrderDb } from '@/server/orderDb';
import { couponRuleFor, describeRpcFailure } from '@/server/orders';
import { usesInvertedOrderFlow } from '@/server/checkout';

/**
 * POST /api/orders
 *
 * Fluxo LEGADO (mock / wizard sem gateway hospedado).
 * Em produção com Asaas, o pedido nasce em /api/payment/create-session — esta
 * rota fica DESLIGADA para evitar pending órfão e estoque preso sem cobrança.
 */
const bodySchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().uuid(),
                quantity: z.number().int().positive().max(99),
                variantId: z.string().uuid().optional(),
            })
        )
        .min(1, { message: 'Cart cannot be empty' })
        .max(50),
    couponCode: z.string().min(1).max(32).optional(),
    paymentMethod: z.enum(['credit', 'pix']).optional(),
    shipping: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    // Com gateway real (fluxo invertido), create-session é a única porta de pedido.
    if (usesInvertedOrderFlow(process.env.PAYMENT_PROVIDER)) {
        return NextResponse.json(
            {
                message:
                    'Esta rota não está disponível com o gateway de pagamento ativo. Use o checkout.',
            },
            { status: 405 }
        );
    }

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
            const falha = describeRpcFailure(dbError);
            if (falha.shouldLog) logError('orders: create_order falhou', dbError);
            return NextResponse.json({ message: falha.message }, { status: falha.status });
        }
    } catch (error) {
        logError('orders: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
