import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Json } from '@/types/supabase';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { createServerSupabaseClient } from '@/lib/server/supabaseServer';
import { couponRuleFor, messageForRpcError } from '@/server/orders';

/**
 * POST /api/orders
 *
 * Persiste um pedido de forma ATÔMICA e server-authoritative, via a RPC public.create_order:
 *  - Pilar 1: o cliente manda só id + quantidade (+ código do cupom). Preço e total são
 *    recomputados no banco. Qualquer total/desconto do cliente é ignorado.
 *  - Pilar 2: baixa de estoque condicional/atômica e cupom de uso único (constraint UNIQUE)
 *    dentro da mesma transação da RPC.
 *  - Pilar 3: exige usuário logado; a identidade é lida do JWT do Clerk pela RPC (clerk_uid()).
 *  - Pilar 4: rate limit no Cofre. Pilar 5: validação Zod + erros sem vazar detalhe interno.
 *
 * Fluxo real (go-live): num gateway de verdade, esta rota deve ser chamada na CONFIRMAÇÃO
 * do pagamento (webhook payment_intent.succeeded), não antes. No provider mock (sucesso
 * síncrono) o checkout a chama logo após a criação da sessão.
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
        const { userId, getToken } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
        }
        const { items, couponCode, paymentMethod, shipping } = parsed.data;
        const coupon = couponRuleFor(couponCode);

        const token = await getToken();
        const supabase = createServerSupabaseClient(token);

        const { data, error } = await supabase.rpc('create_order', {
            p_items: items as Json,
            p_coupon_code: coupon.code,
            p_discount: coupon.discount,
            p_single_use: coupon.singleUse,
            p_min_cart_total: coupon.minCartTotal,
            p_payment_method: paymentMethod ?? 'unknown',
            p_shipping: (shipping ?? null) as Json,
        });

        if (error) {
            const mapped = messageForRpcError(`${error.message} ${error.details ?? ''}`);
            if (mapped.status >= 500) logError('orders: RPC create_order falhou', error);
            return NextResponse.json({ message: mapped.message }, { status: mapped.status });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        logError('orders: erro inesperado', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
