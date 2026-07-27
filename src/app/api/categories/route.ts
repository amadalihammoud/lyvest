import { NextResponse } from 'next/server';

import { logError } from '@/lib/server/logger';
import { getCategories } from '@/server/providers/catalog';

/** GET /api/categories — lista pública, usada pelo menu principal e filtros. */
export async function GET() {
    try {
        const items = await getCategories();
        return NextResponse.json({ items });
    } catch (e) {
        // 503, nunca 200 com lista vazia: "nenhuma categoria" é indistinguível
        // de "a loja não tem categorias", e o menu sumiria em silêncio, sem
        // alerta nenhum. Mesmo tratamento de /api/products.
        logError('api/categories: falha ao listar categorias', e);
        return NextResponse.json(
            { error: 'Catálogo temporariamente indisponível' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
