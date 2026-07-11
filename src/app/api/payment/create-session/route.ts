import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Json } from '@/types/supabase';

import { validateCoupon } from '@/config/coupons';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError, logInfo } from '@/lib/server/logger';
import { createAdminSupabaseClient } from '@/lib/server/supabaseAdmin';
import { createServerSupabaseClient } from '@/lib/server/supabaseServer';
import { couponRuleFor, messageForRpcError } from '@/server/orders';
import { getPaymentProvider } from '@/server/providers/payment';
import { supabase } from '@/server/supabase';

/**
 * POST /api/payment/create-session
 *
 * Cria a sessão de pagamento com FLUXO INVERTIDO (pedido antes do gateway):
 *  1. Pilar 1 (Zero-Trust): confia SOMENTE em id + quantity (e no CÓDIGO do cupom).
 *     Preço unitário e desconto são revalidados no servidor; total do cliente é ignorado.
 *  2. Usuário logado: o pedido é criado ANTES da sessão via RPC create_order (status
 *     'pending', baixa de estoque atômica, cupom de uso único). O orderId segue no
 *     metadata/externalReference para o gateway devolvê-lo no webhook, que fará o
 *     update idempotente pending -> processing (pago).
 *  3. Convidado: sessão sem pedido interno (paridade com o fluxo antigo).
 *  4. Pilar 4: rate limit no Cofre. Pilar 5: validação Zod.
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
            })
        )
        .min(1, { message: 'Cart cannot be empty' })
        .max(50),
    currency: z.string().length(3).optional().default('BRL'),
    // O cliente pode enviar apenas o CÓDIGO do cupom — nunca o valor do desconto.
    couponCode: z.string().min(1).max(32).optional(),
    paymentMethod: z.enum(['credit', 'pix']).optional(),
    shipping: z.record(z.string(), z.unknown()).optional(),
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

        const { items: frontendItems, currency, couponCode, paymentMethod, shipping } = parsed.data;

        // Relê os preços reais no banco (fonte da verdade). Ids de produto são UUID (string).
        const productIds = frontendItems.map((i) => String(i.id));
        const { data: dbProducts, error: dbError } = await supabase
            .from('products')
            .select('id, name, price, promotional_price')
            .in('id', productIds);

        if (dbError || !dbProducts || dbProducts.length === 0) {
            logError('create-session: DB error/produtos não encontrados', dbError);
            return NextResponse.json({ message: 'Failed to verify product information' }, { status: 500 });
        }

        const verifiedItems = frontendItems.map((fItem) => {
            const dbProduct = dbProducts.find((p) => String(p.id) === String(fItem.id));
            if (!dbProduct) throw new Error(`Product ${fItem.id} not found in database`);
            const activePrice = dbProduct.promotional_price || dbProduct.price;
            return { id: dbProduct.id, name: dbProduct.name, price: Number(activePrice), quantity: fItem.quantity };
        });

        // Subtotal recomputado a partir dos preços do banco (nunca do cliente).
        const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Revalida o cupom NO SERVIDOR contra o subtotal real.
        let discountAmount = 0;
        let appliedCoupon: string | null = null;
        if (couponCode) {
            const result = validateCoupon(couponCode, subtotal);
            if (result.valid) {
                discountAmount = Math.round(subtotal * result.discount * 100) / 100;
                appliedCoupon = couponCode.toUpperCase().trim();
            }
        }
        let total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        // Best-effort: identifica o usuário se logado (checkout de convidado permitido).
        const { userId, getToken } = await auth();

        // FLUXO INVERTIDO: apenas para gateway real (asaas) e usuário logado — cria o
        // pedido (pending) ANTES da sessão. No mock, o fluxo legado (wizard -> /api/orders)
        // permanece, evitando pedido duplicado. A RPC é a autoridade final de
        // preço/estoque/cupom; usamos o total dela.
        const providerName = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
        let orderId: string | null = null;
        if (userId && providerName === 'asaas') {
            const coupon = couponRuleFor(couponCode);
            const token = await getToken();
            const userSupabase = createServerSupabaseClient(token);
            const { data: orderData, error: orderError } = await userSupabase.rpc('create_order', {
                p_items: frontendItems.map((i) => ({ id: String(i.id), quantity: i.quantity })) as Json,
                p_coupon_code: coupon.code,
                p_discount: coupon.discount,
                p_single_use: coupon.singleUse,
                p_min_cart_total: coupon.minCartTotal,
                p_payment_method: paymentMethod ?? 'unknown',
                p_shipping: (shipping ?? null) as Json,
            });
            if (orderError) {
                const mapped = messageForRpcError(`${orderError.message} ${orderError.details ?? ''}`);
                if (mapped.status >= 500) logError('create-session: RPC create_order falhou', orderError);
                return NextResponse.json({ message: mapped.message }, { status: mapped.status });
            }
            const rpc = orderData as { orderId?: string; total?: number } | null;
            orderId = rpc?.orderId ? String(rpc.orderId) : null;
            if (typeof rpc?.total === 'number') total = rpc.total;
        }

        const paymentProvider = getPaymentProvider();
        const session = await paymentProvider.createSession({
            items: verifiedItems,
            currency,
            discountAmount,
            amount: total, // valor autoritativo calculado no servidor (RPC quando logado)
            metadata: {
                source: 'lyvest',
                verified: 'true',
                userId: userId || 'guest',
                coupon: appliedCoupon || '',
                orderId: orderId || '',
                // Origem real do request (preview da Vercel muda de host por branch/deploy).
                appUrl: request.headers.get('origin') ?? new URL(request.url).origin,
            },
        });

        // Correlação webhook: grava o id do link/cobrança no pedido (payment_ref).
        if (orderId && session.sessionId) {
            const admin = createAdminSupabaseClient();
            if (admin) {
                const { error: refError } = await admin
                    .from('orders')
                    .update({ payment_ref: session.sessionId })
                    .eq('id', orderId);
                if (refError) logError('create-session: falha ao gravar payment_ref', refError);
            } else {
                logError('create-session: SUPABASE_SECRET_KEY ausente — payment_ref não gravado (webhook usará externalReference)');
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
