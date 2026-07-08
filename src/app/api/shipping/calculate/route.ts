import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { getShippingProvider } from '@/server/services/shipping';
import { supabase } from '@/server/supabase';

/**
 * POST /api/shipping/calculate
 *
 * Pilar 1: o preço de cada item é RELIDO do banco (o `price` do cliente é ignorado) —
 * senão dava para inflar o valor e forjar frete grátis. Pilar 4: rate limit no Cofre.
 * Pilar 5: validação com Zod.
 */
const shippingSchema = z.object({
    zipCode: z.string().regex(/^\d{8}$/, { message: 'ZIP Code must be 8 digits (numeric)' }),
    items: z
        .array(
            z.object({
                id: z.union([z.string(), z.number()]),
                quantity: z.number().int().positive(),
                // Aceito por compatibilidade, mas IGNORADO — o preço vem do banco (ver abaixo).
                price: z.number().min(0).optional(),
            })
        )
        .min(1, { message: 'Items required for shipping calc' }),
});

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'shipping');
    if (!rl.success) {
        return NextResponse.json({ message: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
    }

    try {
        const parsed = shippingSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { message: 'Invalid input', errors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Pilar 1 (Zero-Trust): relê os preços no banco; o `price` do cliente é descartado.
        const { zipCode, items } = parsed.data;
        const ids = items.map((i) => i.id);
        const { data: dbProducts } = await supabase
            .from('products')
            .select('id, price, promotional_price')
            .in('id', ids);

        const verifiedItems = items.map((i) => {
            const db = dbProducts?.find((p) => String(p.id) === String(i.id));
            // Sem correspondência no banco → preço 0 (nunca cai em frete grátis por engano/abuso).
            const price = db ? Number(db.promotional_price || db.price) : 0;
            return { id: i.id, quantity: i.quantity, price };
        });

        // Contrato tipado (ShippingProvider) — sem cast estrutural.
        const provider = getShippingProvider();
        const options = await provider.calculate({ zipCode, items: verifiedItems });
        return NextResponse.json(options);
    } catch (error) {
        logError('shipping/calculate: erro', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
