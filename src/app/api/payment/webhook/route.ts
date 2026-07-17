import crypto from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { orders } from '@/db/schema';
import { markEventProcessed } from '@/lib/server/idempotency';
import { logError, logInfo } from '@/lib/server/logger';
import { db } from '@/server/dbClient';
import { incrementStockDb } from '@/server/orderDb';

/**
 * POST /api/payment/webhook
 *
 * Confirmação server-to-server de pagamento. Suporta:
 *  - Asaas: autenticação pelo header `asaas-access-token` (token fixo configurado no
 *    painel do Asaas e em ASAAS_WEBHOOK_TOKEN), eventos PAYMENT_CONFIRMED/RECEIVED.
 *  - Legado/mock: assinatura HMAC-SHA256 do corpo bruto (PAYMENT_WEBHOOK_SECRET).
 * Fail-closed em produção + idempotência por id de evento. Ao confirmar pagamento,
 * faz o update idempotente do pedido: status 'pending' -> 'processing' (pago),
 * localizado por payment.externalReference (= orders.id) ou payment.paymentLink
 * (= orders.payment_ref). Retorna erro 4xx/5xx quando não conseguir processar,
 * para o gateway reenviar o evento.
 *
 * Banco: Neon via Drizzle (server-only). Não há mais admin client — o servidor
 * é o único ator com acesso ao banco.
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
    type?: string; // formato legado/mock (payment_intent.*)
    event?: string; // formato Asaas (PAYMENT_*)
    payment?: AsaasPayment; // objeto de cobrança do Asaas
    data?: { object?: { id?: string } };
};

// Gate de autenticação: Asaas (token fixo) tem precedência quando configurado;
// caso contrário vale o esquema legado de HMAC. Fail-closed em produção.
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
        // Permite coexistência: se não veio o header do Asaas, tenta o HMAC legado.
        const signature = request.headers.get('x-webhook-signature') || request.headers.get('stripe-signature');
        if (hmacSecret && signature && verifySignature(rawBody, signature, hmacSecret)) return null;
        logError('webhook: autenticação inválida (asaas-access-token/HMAC)');
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Esquema legado (HMAC) — comportamento original preservado.
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

/** Update idempotente: pending -> processing (pago). Lança erro para o gateway reenviar. */
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

    const updated = await db
        .update(orders)
        .set({ status: 'processing' })
        .where(and(eq(orders.status, 'pending'), refCondition))
        .returning({ id: orders.id });

    if (updated.length > 0) {
        logInfo('webhook: pedido marcado como pago (processing)', { orderId: updated[0].id, payment: payment.id });
        // TODO(follow-up): disparar sync com o ERP (Bling) aqui, com retry fora do ciclo
        // do webhook (fila/job) para não segurar a resposta ao gateway.
    } else {
        // Idempotência: pedido já processado (ou referência desconhecida) — não é erro.
        logInfo('webhook: nenhum pedido pending correspondente', { payment: payment.id });
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

    // Atualizar status do pedido para cancelado (idempotente: só sai de não-cancelado).
    await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, order.id));

    logInfo('webhook: pedido marcado como cancelado (reembolsado)', { orderId: order.id });

    // Restaurar estoque dos produtos (atômico via função SQL increment_stock).
    const items = order.items as Array<{ id: string; quantity: number }> | null;
    if (items && Array.isArray(items)) {
        for (const item of items) {
            if (!item.id || !item.quantity) continue;
            const ok = await incrementStockDb(item.id, item.quantity);
            if (ok) {
                logInfo('webhook: estoque restaurado via increment_stock', { productId: item.id, qty: item.quantity });
            } else {
                logError('webhook: falha ao restaurar estoque', { productId: item.id, qty: item.quantity });
            }
        }
    }
}

async function handleEvent(event: WebhookEvent): Promise<void> {
    // Formato Asaas (PAYMENT_*)
    if (event.event) {
        switch (event.event) {
            case 'PAYMENT_CONFIRMED': // cartão confirmado (saldo ainda não disponível)
            case 'PAYMENT_RECEIVED': // pagamento recebido (Pix/boleto/dinheiro em conta)
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

    // Formato legado/mock
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

    try {
        // Idempotência: dedupe por ID do evento.
        const eventId = event.id || event.payment?.id || event.data?.object?.id;
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
