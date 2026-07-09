import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateCoupon } from '@/config/coupons';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { getPaymentProvider } from '@/server/services/payment';
import { supabase } from '@/server/supabase';

/**
 * POST /api/payment/create-session
 *
 * Cria a sessão de pagamento. Pilar 1 (Zero-Trust): confia SOMENTE em id + quantity (e,
 * no máximo, o CÓDIGO do cupom) vindos do cliente. Preço unitário e desconto são
 * REVALIDADOS/RECOMPUTADOS no servidor — o total do cliente é ignorado. Pilar 4: rate limit
 * no Cofre. Auth é best-effort (checkout de convidado permitido) — o userId entra só nos
 * metadados.
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
    // O cliente pode enviar apenas o CÓDIGO do cupom — nunca o valor do desconto.
    couponCode: z.string().min(1).max(32).optional(),
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

        const { items: frontendItems, currency, couponCode } = parsed.data;

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

        // Subtotal recomputado a partir dos preços do banco (nunca do cliente).
        const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Revalida o cupom NO SERVIDOR contra o subtotal real. O desconto é reaplicado aqui;
        // qualquer valor de desconto enviado pelo cliente é ignorado.
        // Observação (Pilar 2): a baixa atômica de cupom de uso único (coupon_redemptions)
        // deve acontecer na criação do pedido server-side — ver TODO no webhook de pagamento.
        let discountAmount = 0;
        let appliedCoupon: string | null = null;
        if (couponCode) {
            const result = validateCoupon(couponCode, subtotal);
            if (result.valid) {
                discountAmount = Math.round(subtotal * result.discount * 100) / 100;
                appliedCoupon = couponCode.toUpperCase().trim();
            }
        }
        const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        // Best-effort: identifica o usuário se logado (não obrigatório).
        const { userId } = await auth();

        // O provider vem de um módulo .js (domínio); tipamos estruturalmente o contrato usado.
        const paymentProvider = getPaymentProvider() as unknown as {
            createSession: (opts: {
                items: Array<{ id: unknown; name: string; price: number; quantity: number }>;
                currency: string;
                discountAmount: number;
                amount: number;
                metadata?: Record<string, string>;
            }) => Promise<unknown>;
        };
        const session = await paymentProvider.createSession({
            items: verifiedItems,
            currency,
            discountAmount,
            amount: total, // valor autoritativo calculado no servidor
            metadata: {
                source: 'lyvest',
                verified: 'true',
                userId: userId || 'guest',
                coupon: appliedCoupon || '',
            },
        });

        // Devolve os valores autoritativos para o cliente exibir (nunca para confiar).
        return NextResponse.json({
            success: true,
            data: session,
            amounts: { subtotal, discountAmount, total, currency },
        });
    } catch (error) {
        logError('create-session: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
