import { NextRequest, NextResponse } from 'next/server';

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
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;

    const items = await getProducts({ categorySlug, search, limit });
    return NextResponse.json({ items });
}
