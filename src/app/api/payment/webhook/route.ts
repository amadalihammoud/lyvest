import crypto from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { markEventProcessed, releaseEventMark } from '@/lib/server/idempotency';
import { logError, logInfo } from '@/lib/server/logger';
import { markOrderPaid, markOrderRefunded } from '@/server/orderService';

/**
 * POST /api/payment/webhook
 * Auth Asaas / HMAC; idempotência; domínio em orderService.
 */
function timingSafeEq(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return timingSafeEq(expected, String(signature));
}

interface AsaasPayment {
    id?: string;
    paymentLink?: string | null;
    externalReference?: string | null;
    value?: number;
    billingType?: string;
    status?: string;
}

type WebhookEvent = {
    id?: string;
    type?: string;
    event?: string;
    payment?: AsaasPayment;
    data?: { object?: { id?: string } };
};

function checkAuthGate(
    request: NextRequest,
    rawBody: string,
    isProd: boolean
): NextResponse | null {
    const asaasToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const hmacSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (asaasToken) {
        const header = request.headers.get('asaas-access-token');
        if (header && timingSafeEq(asaasToken, header)) return null;
        const signature =
            request.headers.get('x-webhook-signature') || request.headers.get('stripe-signature');
        if (hmacSecret && signature && verifySignature(rawBody, signature, hmacSecret)) return null;
        logError('webhook: autenticação inválida (asaas-access-token/HMAC)');
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const signature =
        request.headers.get('x-webhook-signature') || request.headers.get('stripe-signature');
    if (isProd) {
        if (!hmacSecret) {
            logError('webhook: nenhum segredo configurado em produção');
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
        }
        if (!verifySignature(rawBody, signature, hmacSecret)) {
            logError('webhook: assinatura inválida');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        return null;
    }
    if (hmacSecret && signature && !verifySignature(rawBody, signature, hmacSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    return null;
}

async function handlePaid(payment: AsaasPayment): Promise<void> {
    const result = await markOrderPaid({
        externalReference: payment.externalReference,
        paymentLink: payment.paymentLink,
        paymentId: payment.id,
        value: payment.value,
    });

    if (result.kind === 'amount_mismatch') {
        throw new Error(
            `AMOUNT_MISMATCH order=${result.orderId} expected=${result.expected} got=${result.received}`
        );
    }
}

async function handleEvent(event: WebhookEvent): Promise<void> {
    if (event.event) {
        switch (event.event) {
            case 'PAYMENT_CONFIRMED':
            case 'PAYMENT_RECEIVED':
                await handlePaid(event.payment ?? {});
                return;
            case 'PAYMENT_REFUNDED':
            case 'PAYMENT_CHARGEBACK_REQUESTED':
                await markOrderRefunded({
                    externalReference: event.payment?.externalReference,
                    paymentLink: event.payment?.paymentLink,
                    paymentId: event.payment?.id,
                });
                return;
            default:
                logInfo('webhook: evento Asaas não tratado', event.event);
                return;
        }
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
        case 'order.paid':
            logInfo('webhook: pagamento capturado (formato legado)', event.data?.object?.id);
            return;
        case 'payment_intent.payment_failed':
            logInfo('webhook: pagamento falhou', event.data?.object?.id);
            return;
        default:
            logInfo('webhook: tipo de evento não tratado', event.type);
    }
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const isProd = process.env.NODE_ENV === 'production';

    const gateError = checkAuthGate(request, rawBody, isProd);
    if (gateError) return gateError;

    let event: WebhookEvent;
    try {
        event = JSON.parse(rawBody || '{}');
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventId = event.id || event.payment?.id || event.data?.object?.id;
    const isNew = await markEventProcessed(eventId, 'payment');
    if (!isNew) {
        logInfo('webhook: evento duplicado ignorado', eventId);
        return NextResponse.json({ received: true, duplicate: true });
    }

    try {
        await handleEvent(event);
        return NextResponse.json({ received: true });
    } catch (err) {
        await releaseEventMark(eventId, 'payment');
        logError('webhook: erro ao processar evento', err);
        return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 });
    }
}
