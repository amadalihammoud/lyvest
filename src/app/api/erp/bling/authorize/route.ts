import crypto from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { buildAuthorizeUrl, isBlingConfigured } from '@/server/bling/client';

/**
 * GET /api/erp/bling/authorize?key=INTERNAL_API_KEY
 *
 * Inicia o fluxo OAuth do Bling: redireciona para a tela de autorização
 * (o dono da conta Bling precisa estar logado no navegador). Protegida por
 * INTERNAL_API_KEY para ninguém disparar autorizações no seu lugar.
 * O state assinado (HMAC) é validado no callback (anti-CSRF).
 */
export async function GET(request: NextRequest) {
    const key = request.nextUrl.searchParams.get('key') ?? '';
    if (!isAuthorizedInternal(key, process.env.INTERNAL_API_KEY ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isBlingConfigured()) {
        return NextResponse.json(
            { error: 'BLING_CLIENT_ID/BLING_CLIENT_SECRET não configurados' },
            { status: 500 }
        );
    }

    // state = nonce.hmac(nonce) — validável sem sessão/armazenamento
    const nonce = crypto.randomBytes(16).toString('hex');
    const sig = crypto
        .createHmac('sha256', process.env.INTERNAL_API_KEY ?? '')
        .update(nonce)
        .digest('hex')
        .slice(0, 32);
    const state = `${nonce}.${sig}`;

    return NextResponse.redirect(buildAuthorizeUrl(state));
}
