import { NextRequest, NextResponse } from 'next/server';

import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError } from '@/lib/server/logger';
import { isBlingConfigured } from '@/server/bling/client';
import { syncCatalog } from '@/server/bling/syncCatalog';

export const maxDuration = 300; // catálogos grandes: até 5 min

/**
 * POST /api/erp/bling/sync-catalog
 *
 * Sincroniza categorias + produtos do Bling para o Neon (upsert por bling_id;
 * adota itens do seed por slug; nunca desativa nada sozinho — devolve relatório).
 * Auth interna fail-closed (Authorization: Bearer INTERNAL_API_KEY).
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (!isAuthorizedInternal(authHeader, `Bearer ${process.env.INTERNAL_API_KEY}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isBlingConfigured()) {
        return NextResponse.json(
            { error: 'BLING_CLIENT_ID/BLING_CLIENT_SECRET não configurados' },
            { status: 500 }
        );
    }

    try {
        const report = await syncCatalog();
        return NextResponse.json({ success: true, report });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logError('bling/sync-catalog: falha', e);
        const status = msg.startsWith('BLING_NOT_AUTHORIZED') ? 409 : 502;
        return NextResponse.json({ error: msg.slice(0, 200) }, { status });
    }
}
