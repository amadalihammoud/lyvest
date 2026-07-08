import crypto from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { markEventProcessed } from '@/lib/server/idempotency';
import { logError, logInfo } from '@/lib/server/logger';
import { fulfillOrderPaid } from '@/server/services/orders';

/**
 * POST /api/payment/webhook
 *
 * Pilar 1/2: verificação de assinatura HMAC fail-closed em produção + idempotência.
 * Usa o corpo bruto (request.text()) para o HMAC.
 */
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type WebhookEvent = {
    id?: string;
    type?: string;
    data?: { object?: { id?: string; metadata?: { orderNumber?: string } } };
};

// Gate de assinatura: retorna a resposta de erro se inválida, ou null se OK.
function checkSignatureGate(
    rawBody: string,
    signature: string | null,
    secret: string | undefined,
    isProd: boolean
): NextResponse | null {
    if (isProd) {
        if (!secret) {
            logError('webhook: PAYMENT_WEBHOOK_SECRET ausente em produção');
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
        }
        if (!verifySignature(rawBody, signature, secret)) {
            logError('webhook: assinatura inválida');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        return null;
    }
    if (secret && signature && !verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    return null;
}

async function handleEvent(event: WebhookEvent): Promise<void> {
    switch (event.type) {
        case 'payment_intent.succeeded':
        case 'order.paid': {
            logInfo('webhook: pagamento capturado', event.data?.object?.id);
            // Fulfillment atômico e idempotente: decremento de estoque + resgate de cupom
            // de uso único (RPC mark_order_paid). No-op fail-safe sem service-role.
            const orderNumber = event.data?.object?.metadata?.orderNumber;
            await fulfillOrderPaid(orderNumber);
            break;
        }
        case 'payment_intent.payment_failed':
            logInfo('webhook: pagamento falhou', event.data?.object?.id);
            break;
        default:
            logInfo('webhook: tipo de evento não tratado', event.type);
    }
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const signature =
        request.headers.get('x-webhook-signature') || request.headers.get('stripe-signature');
    const isProd = process.env.NODE_ENV === 'production';

    const gateError = checkSignatureGate(rawBody, signature, secret, isProd);
    if (gateError) return gateError;

    let event: WebhookEvent;
    try {
        event = JSON.parse(rawBody || '{}');
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    try {
        // Idempotência: dedupe por ID do evento.
        const eventId = event.id || event.data?.object?.id;
        const isNew = await markEventProcessed(eventId, 'payment');
        if (!isNew) {
            logInfo('webhook: evento duplicado ignorado', eventId);
            return NextResponse.json({ received: true, duplicate: true });
        }

        await handleEvent(event);
        return NextResponse.json({ received: true });
    } catch (err) {
        logError('webhook: erro ao processar evento', err);
        return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 });
    }
}
