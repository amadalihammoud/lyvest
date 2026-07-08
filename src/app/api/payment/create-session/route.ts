import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateCoupon } from '@/config/coupons';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { persistPendingOrder } from '@/server/services/orders';
import { getPaymentProvider } from '@/server/services/payment';
import { supabase } from '@/server/supabase';

/**
 * POST /api/payment/create-session
 *
 * Cria a sessão de pagamento. Pilar 1 (Zero-Trust): confia SOMENTE em id + quantity do
 * cliente e relê os preços no banco; o cupom é REVALIDADO no servidor (nunca o desconto
 * do cliente). Pilar 4: rate limit no Cofre. Auth é best-effort (checkout de convidado
 * permitido) — o userId entra nos metadados e no pedido persistido.
 */
const paymentSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.union([z.string(), z.number()]),
                quantity: z.number().int().positive(),
            })
        )
        .min(1, { message: 'Cart cannot be empty' }),
    currency: z.string().length(3).optional().default('BRL'),
    // Zero-Trust: aceitamos só o CÓDIGO do cupom; o desconto é recalculado no servidor.
    coupon: z.string().min(1).max(32).optional(),
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

        const { items: frontendItems, currency, coupon } = parsed.data;

        // Relê os preços reais no banco (fonte da verdade).
        const productIds = frontendItems.map((i) => i.id);
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

        // Totais recomputados no servidor (nunca confiar no total do cliente).
        const subtotal = verifiedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

        // Cupom REVALIDADO no servidor (Zero-Trust): usamos só o código e recalculamos o desconto.
        let discount = 0;
        let appliedCoupon: string | null = null;
        if (coupon) {
            const couponResult = validateCoupon(coupon, subtotal);
            if (couponResult.valid) {
                discount = Number((subtotal * couponResult.discount).toFixed(2));
                appliedCoupon = coupon.toUpperCase().trim();
            }
        }
        const total = Number((subtotal - discount).toFixed(2));

        // Best-effort: identifica o usuário se logado (não obrigatório).
        const { userId } = await auth();

        // Número de pedido único; usado para o fulfillment idempotente no webhook.
        const orderNumber = `LV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        // Persiste o pedido 'pending' com itens verificados (fail-safe sem service-role).
        await persistPendingOrder({
            orderNumber,
            userId: userId || null,
            items: verifiedItems,
            subtotal,
            discount,
            total,
            coupon: appliedCoupon,
        });

        // O provider vem de um módulo .js (domínio); tipamos estruturalmente o contrato usado.
        const paymentProvider = getPaymentProvider() as unknown as {
            createSession: (opts: {
                items: Array<{ id: unknown; name: string; price: number; quantity: number }>;
                currency: string;
                metadata?: Record<string, string>;
            }) => Promise<unknown>;
        };
        const session = await paymentProvider.createSession({
            items: verifiedItems,
            currency,
            metadata: {
                source: 'lyvest',
                verified: 'true',
                userId: userId || 'guest',
                orderNumber,
            },
        });

        return NextResponse.json({ success: true, data: session, orderNumber });
    } catch (error) {
        logError('create-session: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
