import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { orders, products } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError, logInfo } from '@/lib/server/logger';
import { buildCreateOrderParams, buildSessionMetadata, normalizeCreateOrderResult, usesInvertedOrderFlow } from '@/server/checkout';
import { db } from '@/server/dbClient';
import { createOrderDb } from '@/server/orderDb';
import { couponRuleFor, describeRpcFailure } from '@/server/orders';
import { buildVerifiedItems, computeSubtotal, computeTotal, resolveDiscount } from '@/server/pricing';
import { getPaymentProvider } from '@/server/providers/payment';

/**
 * POST /api/payment/create-session
 *
 * Cria a sessão de pagamento com FLUXO INVERTIDO (pedido antes do gateway):
 *  1. Pilar 1 (Zero-Trust): confia SOMENTE em id + quantity (e no CÓDIGO do cupom).
 *     Preço unitário e desconto são revalidados no servidor; total do cliente é ignorado.
 *  2. Usuário logado OU convidado: o pedido é criado ANTES da sessão via função SQL
 *     create_order (status 'pending', baixa de estoque atômica, cupom de uso único).
 *     A identidade vem do Clerk auth() no servidor; convidado usa guest_email.
 *     O orderId segue no metadata/externalReference para o gateway devolvê-lo no
 *     webhook, que fará o update idempotente pending -> processing (pago).
 *  3. Pilar 4: rate limit. Pilar 5: validação Zod.
 *
 * TODO(follow-up): job de expiração de pedidos 'pending' antigos (restaurar estoque de
 * links de pagamento abandonados).
 */
const paymentSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.union([z.string(), z.number()]),
                quantity: z.number().int().positive().max(99),
                // Obrigatorio quando o produto tem grade; create_order rejeita sem ele.
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

        const { items: frontendItems, currency, couponCode, paymentMethod, shipping, customer } = parsed.data;

        // Relê os preços reais no banco (fonte da verdade). Ids de produto são UUID (string).
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

        if (!dbProducts || dbProducts.length === 0) {
            logError('create-session: produtos não encontrados', { productIds });
            return NextResponse.json({ message: 'Failed to verify product information' }, { status: 500 });
        }

        // Toda a matemática vive em src/server/pricing.ts (pura e testada).
        // buildVerifiedItems descarta qualquer preço ou nome vindo do cliente e
        // usa a linha do banco — e trata promoção "0.00" como inválida, que o
        // `promotionalPrice ?? price` anterior adotava, cobrando R$0 pelo item.
        const verifiedItems = buildVerifiedItems(frontendItems, dbProducts);
        const subtotal = computeSubtotal(verifiedItems);
        const { discountAmount, appliedCoupon } = resolveDiscount(couponCode, subtotal);
        let total = computeTotal(subtotal, discountAmount);

        // Best-effort: identifica o usuário se logado (checkout de convidado permitido).
        const { userId } = await auth();

        // FLUXO INVERTIDO: apenas para gateway real (asaas) — cria o pedido (pending)
        // ANTES da sessão. No mock, o fluxo legado (wizard -> /api/orders) permanece,
        // evitando pedido duplicado. A função SQL é a autoridade final de
        // preço/estoque/cupom; usamos o total dela.
        let orderId: string | null = null;

        if (usesInvertedOrderFlow(process.env.PAYMENT_PROVIDER)) {
            try {
                const rpc = await createOrderDb(
                    buildCreateOrderParams({
                        userId,
                        items: frontendItems,
                        coupon: couponRuleFor(couponCode),
                        paymentMethod,
                        shipping,
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

        const paymentProvider = getPaymentProvider();
        const session = await paymentProvider.createSession({
            items: verifiedItems,
            currency,
            discountAmount,
            amount: total, // valor autoritativo calculado no servidor
            // Metadata volta no webhook; a montagem vive em src/server/checkout.ts.
            metadata: buildSessionMetadata({
                userId,
                appliedCoupon,
                orderId,
                originHeader: request.headers.get('origin'),
                requestUrl: request.url,
            }),
        });

        // Correlação webhook: grava o id do link/cobrança no pedido (payment_ref).
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

        // Devolve os valores autoritativos para o cliente exibir (nunca para confiar).
        return NextResponse.json({
            success: true,
            data: { ...session, orderId },
            amounts: { subtotal, discountAmount, total, currency },
        });
    } catch (error) {
        logError('create-session: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
