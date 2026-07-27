import { NextRequest, NextResponse } from 'next/server';

import { logError } from '@/lib/server/logger';
import { getProducts } from '@/server/providers/catalog';

/**
 * GET /api/products
 * Query params opcionais: ?categoria=<slug> ?q=<busca> ?limit=<n>
 * Pública (catálogo é público) — cache curto no client via useCatalogStore.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categoria') || undefined;
    const search = searchParams.get('q') || undefined;

    // `Number()` cru aceitava negativo, zero e NaN. Um `?limit=-1` chegava ao
    // Postgres como LIMIT negativo, que é erro — e antes esse erro caía no
    // fallback de mock, devolvendo 200 com catálogo falso. Agora é sanitizado
    // na borda: fora da faixa, ignora o parâmetro.
    const limitParam = Number(searchParams.get('limit'));
    const limit =
        Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 200
            ? limitParam
            : undefined;

    try {
        const items = await getProducts({ categorySlug, search, limit });
        return NextResponse.json({ items });
    } catch (e) {
        // Falha de catálogo é 503, nunca 200 com dado inventado: o front mostra
        // estado de erro e o monitoramento enxerga o incidente.
        logError('api/products: falha ao listar catálogo', e);
        return NextResponse.json(
            { error: 'Catálogo temporariamente indisponível' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
