import { NextResponse } from 'next/server';

import { getFreeShippingThreshold } from '@/server/financialConfig';

/**
 * GET /api/config/shipping
 *
 * Config pública de frete para o cliente (valor mínimo de frete grátis).
 * Leitura pública e cacheável — sem rate limit por doutrina do projeto
 * (rate limit é para rotas transacionais; ver src/lib/rate-limit.ts).
 */
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
    const freeShippingThreshold = await getFreeShippingThreshold();
    return NextResponse.json(
        { freeShippingThreshold },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
}
