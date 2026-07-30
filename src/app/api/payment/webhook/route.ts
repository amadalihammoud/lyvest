import crypto from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { orders } from '@/db/schema';
import { markEventProcessed, releaseEventMark } from '@/lib/server/idempotency';
import { logError, logInfo } from '@/lib/server/logger';
import { db } from '@/server/dbClient';
import { incrementStockDb, incrementVariantStockDb } from '@/server/orderDb';

/**
 * POST /api/payment/webhook
 *
 * Confirmação server-to-server de pagamento. Suporta:
 *  - Asaas: autenticação pelo header `asaas-access-token` (token fixo configurado no
 *    painel do Asaas e em ASAAS_WEBHOOK_TOKEN), eventos PAYMENT_CONFIRMED/RECEIVED.
 *  - Legado/mock: assinatura HMAC-SHA256 do corpo bruto (PAYMENT_WEBHOOK_SECRET).
 * Fail-closed em produção + idempotência por id de evento. Ao confirmar pagamento,
 * confere payment.value ≈ orders.total_amount e faz update idempotente
 * pending -> processing. Retorna erro 4xx/5xx quando não conseguir processar,
 * para o gateway reenviar o evento.
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

/** Tolerância de R$ 0,05 para arredondamento de centavos entre gateway e SQL. */
const AMOUNT_TOLERANCE = 0.05;

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
        const signature = request.headers.get('x-webhook-signature') || request.headers.get('stripe-signature');
        if (hmacSecret && signature && verifySignature(rawBody, signature, hmacSecret)) return null;
        logError('webhook: autenticação inválida (asaas-access-token/HMAC)');
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const signature = request.headers.get('x-webhook-signature') || request.headers.get('stripe-signature');
    if (isProd) {
        if (!hmacSecret) {
            logError('webhook: nenhum segredo configurado em produção (ASAAS_WEBHOOK_TOKEN/PAYMENT_WEBHOOK_SECRET)');
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

/** Update idempotente: pending -> processing (pago). Lança se valor divergir. */
async function markOrderPaid(payment: AsaasPayment): Promise<void> {
    let refCondition;
    if (payment.externalReference) {
        refCondition = eq(orders.id, payment.externalReference);
    } else if (payment.paymentLink) {
        refCondition = eq(orders.paymentRef, payment.paymentLink);
    } else {
        logInfo('webhook: pagamento sem referência de pedido (ignorado)', payment.id);
        return;
    }

    // Lê o pedido ANTES de marcar: precisamos do total_amount para conferir valor.
    const found = await db
        .select({ id: orders.id, status: orders.status, totalAmount: orders.totalAmount })
        .from(orders)
        .where(refCondition)
        .limit(1);

    if (found.length === 0) {
        logInfo('webhook: nenhum pedido correspondente', { payment: payment.id });
        return;
    }

    const order = found[0];

    if (order.status !== 'pending') {
        // Já processado (ou cancelado) — idempotente, não é erro.
        logInfo('webhook: pedido não está pending (ignorado)', { orderId: order.id, status: order.status });
        return;
    }

    // Conferência de valor: se o gateway manda value, tem que bater com o total do pedido.
    // Sem value no payload, logamos e seguimos (alguns eventos legados omitem).
    if (typeof payment.value === 'number' && Number.isFinite(payment.value)) {
        const expected = Number(order.totalAmount);
        if (Number.isFinite(expected) && Math.abs(payment.value - expected) > AMOUNT_TOLERANCE) {
            logError('webhook: VALOR DIVERGENTE — recusando marcar como pago', {
                orderId: order.id,
                expected,
                received: payment.value,
                payment: payment.id,
            });
            // Lança para o gateway reenviar e para não liberar mercadoria sem bater o caixa.
            throw new Error(`AMOUNT_MISMATCH order=${order.id} expected=${expected} got=${payment.value}`);
        }
    } else {
        logInfo('webhook: payment.value ausente — não foi possível conferir valor', {
            orderId: order.id,
            payment: payment.id,
        });
    }

    const updated = await db
        .update(orders)
        .set({ status: 'processing' })
        .where(and(eq(orders.status, 'pending'), eq(orders.id, order.id)))
        .returning({ id: orders.id });

    if (updated.length > 0) {
        logInfo('webhook: pedido marcado como pago (processing)', { orderId: updated[0].id, payment: payment.id });
        // TODO(follow-up): disparar sync com o ERP (Bling) aqui, com retry fora do ciclo
        // do webhook (fila/job) para não segurar a resposta ao gateway.
    } else {
        logInfo('webhook: nenhum pedido pending correspondente após race', { payment: payment.id });
    }
}

async function markOrderRefunded(payment: AsaasPayment): Promise<void> {
    let refCondition;
    if (payment.externalReference) {
        refCondition = eq(orders.id, payment.externalReference);
    } else if (payment.paymentLink) {
        refCondition = eq(orders.paymentRef, payment.paymentLink);
    } else {
        logInfo('webhook: reembolso sem referência de pedido (ignorado)', payment.id);
        return;
    }

    const found = await db
        .select({ id: orders.id, status: orders.status, items: orders.items })
        .from(orders)
        .where(refCondition)
        .limit(1);

    if (found.length === 0) {
        logInfo('webhook: nenhum pedido correspondente para reembolso', { payment: payment.id });
        return;
    }

    const order = found[0];
    if (order.status === 'cancelled') {
        logInfo('webhook: pedido de reembolso já está cancelado', { orderId: order.id });
        return;
    }

    await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, order.id));

    logInfo('webhook: pedido marcado como cancelado (reembolsado)', { orderId: order.id });

    const items = order.items as Array<{
        id: string;
        variantId?: string | null;
        quantity: number;
    }> | null;
    if (items && Array.isArray(items)) {
        for (const item of items) {
            if (!item.id || !item.quantity) continue;
            const ok = item.variantId
                ? await incrementVariantStockDb(item.variantId, item.quantity)
                : await incrementStockDb(item.id, item.quantity);
            if (ok) {
                logInfo('webhook: estoque restaurado', {
                    productId: item.id,
                    variantId: item.variantId ?? null,
                    qty: item.quantity,
                });
            } else {
                logError('webhook: falha ao restaurar estoque', {
                    productId: item.id,
                    variantId: item.variantId ?? null,
                    qty: item.quantity,
                });
            }
        }
    }
}

async function handleEvent(event: WebhookEvent): Promise<void> {
    if (event.event) {
        switch (event.event) {
            case 'PAYMENT_CONFIRMED':
            case 'PAYMENT_RECEIVED':
                await markOrderPaid(event.payment ?? {});
                return;
            case 'PAYMENT_REFUNDED':
            case 'PAYMENT_CHARGEBACK_REQUESTED':
                await markOrderRefunded(event.payment ?? {});
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
