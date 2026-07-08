import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { getShippingProvider } from '@/server/services/shipping';

/**
 * POST /api/shipping/calculate
 *
 * Pilar 4: rate limit no Cofre. Pilar 5: validação com Zod.
 */
const shippingSchema = z.object({
    zipCode: z.string().regex(/^\d{8}$/, { message: 'ZIP Code must be 8 digits (numeric)' }),
    items: z
        .array(
            z.object({
                id: z.union([z.string(), z.number()]),
                quantity: z.number().int().positive(),
                // TODO(Pilar 1 / Fase 2): derivar o valor do carrinho do banco em vez de confiar
                // no `price` do cliente para o limite de frete grátis.
                price: z.number().min(0),
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

        // O provider vem de um módulo .js (domínio); tipamos estruturalmente o contrato usado.
        const provider = getShippingProvider() as unknown as {
            calculate: (opts: {
                zipCode: string;
                items: Array<{ id: unknown; quantity: number; price: number }>;
            }) => Promise<unknown>;
        };
        const options = await provider.calculate(parsed.data);
        return NextResponse.json(options);
    } catch (error) {
        logError('shipping/calculate: erro', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
