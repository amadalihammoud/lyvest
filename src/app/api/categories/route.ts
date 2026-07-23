import { NextResponse } from 'next/server';

import { getCategories } from '@/server/providers/catalog';

/** GET /api/categories — lista pública, usada pelo menu principal e filtros. */
export async function GET() {
    const items = await getCategories();
    return NextResponse.json({ items });
}
