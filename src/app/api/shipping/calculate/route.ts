import { inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { products } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { db } from '@/server/dbClient';
import { effectiveUnitPrice } from '@/server/pricing';
import { getShippingProvider } from '@/server/providers/shipping';

/**
 * POST /api/shipping/calculate
 *
 * Zero-Trust: do cliente vem só id + quantity + CEP. Preço unitário para o
 * limite de frete grátis é relido do banco — o `price` do body é ignorado.
 */
const shippingSchema = z.object({
    zipCode: z.string().regex(/^\d{8}$/, { message: 'ZIP Code must be 8 digits (numeric)' }),
    items: z
        .array(
            z.object({
                id: z.union([z.string(), z.number()]),
                quantity: z.number().int().positive().max(99),
                // Aceito no schema só para não quebrar clients antigos; IGNORADO.
                price: z.number().min(0).optional(),
            })
        )
        .min(1, { message: 'Items required for shipping calc' })
        .max(50),
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

        const { zipCode, items: clientItems } = parsed.data;
        const productIds = clientItems.map((i) => String(i.id));

        const dbProducts = await db
            .select({
                id: products.id,
                price: products.price,
                promotionalPrice: products.promotionalPrice,
            })
            .from(products)
            .where(inArray(products.id, productIds));

        const byId = new Map(dbProducts.map((p) => [p.id, p]));
        const pricedItems: Array<{ id: string; quantity: number; price: number }> = [];

        for (const line of clientItems) {
            const row = byId.get(String(line.id));
            if (!row) {
                return NextResponse.json(
                    { message: 'Um item do carrinho não está disponível para cálculo de frete.' },
                    { status: 409 }
                );
            }
            pricedItems.push({
                id: row.id,
                quantity: line.quantity,
                price: effectiveUnitPrice(row.price, row.promotionalPrice),
            });
        }

        const provider = getShippingProvider();
        const options = await provider.calculate({ zipCode, items: pricedItems });
        return NextResponse.json(options);
    } catch (error) {
        logError('shipping/calculate: erro', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
