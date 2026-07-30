import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { orders, products } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError, logInfo } from '@/lib/server/logger';
import {
    buildCreateOrderParams,
    buildSessionMetadata,
    normalizeCreateOrderResult,
    usesInvertedOrderFlow,
} from '@/server/checkout';
import { db } from '@/server/dbClient';
import { cancelPendingOrderDb, createOrderDb } from '@/server/orderDb';
import { couponRuleFor, describeRpcFailure } from '@/server/orders';
import { buildVerifiedItems, computeSubtotal, computeTotal, resolveDiscount, toCents } from '@/server/pricing';
import { getPaymentProvider } from '@/server/providers/payment';
import { resolveAuthoritativeShipping } from '@/server/shippingAuth';

const paymentSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.union([z.string(), z.number()]),
                quantity: z.number().int().positive().max(99),
                variantId: z.string().uuid().optional(),
            })
        )
        .min(1, { message: 'Cart cannot be empty' })
        .max(50),
    currency: z.string().length(3).optional().default('BRL'),
    couponCode: z.string().min(1).max(32).optional(),
    paymentMethod: z.enum(['credit', 'pix']).optional(),
    shipping: z.record(z.string(), z.unknown()).optional(),
    customer: z
        .object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().email().optional(),
        })
        .optional(),
});

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'checkout');
    if (!rl.success) {
        return NextResponse.json({ message: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
    }

    try {
        const parsed = paymentSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { message: 'Invalid input', errors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { items: frontendItems, currency, couponCode, paymentMethod, shipping, customer } =
            parsed.data;

        const productIds = frontendItems.map((i) => String(i.id));
        let dbProducts: Array<{ id: string; name: string; price: string; promotionalPrice: string | null }>;
        try {
            dbProducts = await db
                .select({
                    id: products.id,
                    name: products.name,
                    price: products.price,
                    promotionalPrice: products.promotionalPrice,
                })
                .from(products)
                .where(inArray(products.id, productIds));
        } catch (dbError) {
            logError('create-session: DB error ao verificar produtos', dbError);
            return NextResponse.json({ message: 'Failed to verify product information' }, { status: 500 });
        }

        const idsDistintos = new Set(productIds);
        if (dbProducts.length < idsDistintos.size) {
            const achados = new Set(dbProducts.map((p) => p.id));
            logInfo('create-session: item do carrinho indisponivel', {
                faltando: [...idsDistintos].filter((id) => !achados.has(id)),
            });
            return NextResponse.json(
                { message: 'Um item do seu carrinho não está mais disponível. Revise o carrinho.' },
                { status: 409 }
            );
        }

        const verifiedItems = buildVerifiedItems(frontendItems, dbProducts);
        const subtotal = computeSubtotal(verifiedItems);
        const { discountAmount, appliedCoupon } = resolveDiscount(couponCode, subtotal);
        const productsTotal = computeTotal(subtotal, discountAmount);

        let shippingRecord: Record<string, unknown> | null = shipping ?? null;
        let shippingAmount = 0;
        try {
            const authShipping = await resolveAuthoritativeShipping(
                shipping as Record<string, unknown> | undefined,
                verifiedItems.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price }))
            );
            shippingRecord = authShipping.record;
            shippingAmount = authShipping.price;
            if (authShipping.record._invalidOption) {
                return NextResponse.json(
                    { message: 'Opção de frete inválida. Recalcule o frete e tente novamente.' },
                    { status: 400 }
                );
            }
        } catch (shipErr) {
            logError('create-session: falha ao resolver frete autoritativo', shipErr);
            return NextResponse.json(
                { message: 'Não foi possível calcular o frete. Tente novamente.' },
                { status: 502 }
            );
        }

        let total = toCents(productsTotal + shippingAmount);

        const { userId } = await auth();

        let orderId: string | null = null;

        if (usesInvertedOrderFlow(process.env.PAYMENT_PROVIDER)) {
            try {
                const rpc = await createOrderDb(
                    buildCreateOrderParams({
                        userId,
                        items: frontendItems,
                        coupon: couponRuleFor(couponCode),
                        paymentMethod,
                        shipping: shippingRecord ?? undefined,
                        customerEmail: customer?.email,
                    })
                );
                const normalizado = normalizeCreateOrderResult(rpc, total);
                orderId = normalizado.orderId;
                total = normalizado.total;
            } catch (rpcError) {
                const falha = describeRpcFailure(rpcError);
                if (falha.shouldLog) logError('create-session: create_order falhou', rpcError);
                return NextResponse.json({ message: falha.message }, { status: falha.status });
            }
        }

        const customerName = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim();

        const paymentProvider = getPaymentProvider();
        let session;
        try {
            session = await paymentProvider.createSession({
                items: verifiedItems,
                currency,
                discountAmount,
                amount: total,
                paymentMethod,
                metadata: buildSessionMetadata({
                    userId,
                    appliedCoupon,
                    orderId,
                    originHeader: request.headers.get('origin'),
                    requestUrl: request.url,
                    customerEmail: customer?.email,
                    customerName: customerName || undefined,
                }),
            });
        } catch (gatewayError) {
            logError(`create-session: gateway falhou apos criar pedido ${orderId ?? 'nenhum'}`, gatewayError);

            const desfeito = await cancelPendingOrderDb(orderId, appliedCoupon);
            logInfo('create-session: compensacao do pedido orfao', { orderId, desfeito });

            return NextResponse.json(
                { message: 'Não foi possível iniciar o pagamento. Tente novamente em instantes.' },
                { status: 502 }
            );
        }

        if (orderId && session.sessionId) {
            try {
                await db
                    .update(orders)
                    .set({ paymentRef: session.sessionId })
                    .where(eq(orders.id, orderId));
            } catch (refError) {
                logError('create-session: falha ao gravar payment_ref (webhook usará externalReference)', refError);
            }
            logInfo('create-session: pedido criado antes da sessão', { orderId, provider: session.provider });
        }

        return NextResponse.json({
            success: true,
            data: { ...session, orderId },
            amounts: {
                subtotal,
                discountAmount,
                shipping: shippingAmount,
                total,
                currency,
            },
        });
    } catch (error) {
        logError('create-session: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
