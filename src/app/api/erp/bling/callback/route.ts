import crypto from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { logError, logInfo } from '@/lib/server/logger';
import { exchangeAuthCode } from '@/server/bling/client';

/**
 * GET /api/erp/bling/callback?code=...&state=...
 *
 * Callback OAuth do Bling (URL configurada no cadastro do aplicativo).
 * Valida o state assinado (emitido por /authorize), troca o code por tokens
 * e persiste na tabela bling_tokens. Os tokens NUNCA aparecem na resposta.
 */
function validState(state: string): boolean {
    const [nonce, sig] = state.split('.');
    if (!nonce || !sig) return false;
    const expected = crypto
        .createHmac('sha256', process.env.INTERNAL_API_KEY ?? '')
        .update(nonce)
        .digest('hex')
        .slice(0, 32);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state') ?? '';

    if (!code || !validState(state)) {
        return NextResponse.json({ error: 'Invalid code/state' }, { status: 400 });
    }

    try {
        await exchangeAuthCode(code);
        logInfo('bling/callback: aplicativo autorizado');
        return new NextResponse(
            '<html><body style="font-family:sans-serif;padding:2rem"><h2>✅ Bling conectado</h2><p>Autorização concluída. Pode fechar esta aba — o sync de catálogo já pode ser executado.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    } catch (e) {
        logError('bling/callback: falha ao trocar code por tokens', e);
        return NextResponse.json({ error: 'Falha na autorização Bling' }, { status: 502 });
    }
}
