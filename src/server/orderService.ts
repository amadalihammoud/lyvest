/**
 * Domínio de pedido: paid / refund / expire / payment_ref / ERP.
 *
 * Rotas HTTP (webhook, cron, create-session) só adaptam I/O;
 * a regra de negócio mora aqui para não divergir entre caminhos.
 */
import { and, eq, lt } from 'drizzle-orm';

import { orders } from '../db/schema';
import { logError, logInfo } from '../lib/server/logger';
import { db } from './dbClient';
import { cancelPendingOrderDb, incrementStockDb, incrementVariantStockDb } from './orderDb';
import { syncOrderToErpBestEffort } from './providers/erp';

/** Tolerância de R$ 0,05 entre gateway e SQL. */
export const AMOUNT_TOLERANCE = 0.05;

export interface PaymentRef {
    externalReference?: string | null;
    paymentLink?: string | null;
    paymentId?: string | null;
    value?: number;
}

export type MarkPaidResult =
    | { kind: 'paid'; orderId: string }
    | { kind: 'already'; orderId: string; status: string }
    | { kind: 'not_found' }
    | { kind: 'no_ref' }
    | { kind: 'amount_mismatch'; orderId: string; expected: number; received: number };

function refCondition(payment: PaymentRef) {
    if (payment.externalReference) return eq(orders.id, payment.externalReference);
    if (payment.paymentLink) return eq(orders.paymentRef, payment.paymentLink);
    if (payment.paymentId) return eq(orders.paymentRef, payment.paymentId);
    return null;
}

/**
 * Confirma pagamento: pending → processing, confere valor, dispara ERP best-effort.
 * Idempotente se já processing.
 */
export async function markOrderPaid(payment: PaymentRef): Promise<MarkPaidResult> {
    const condition = refCondition(payment);
    if (!condition) {
        logInfo('orderService: pagamento sem referência de pedido', payment.paymentId);
        return { kind: 'no_ref' };
    }

    const found = await db
        .select({ id: orders.id, status: orders.status, totalAmount: orders.totalAmount })
        .from(orders)
        .where(condition)
        .limit(1);

    if (found.length === 0) {
        logInfo('orderService: nenhum pedido correspondente', { payment: payment.paymentId });
        return { kind: 'not_found' };
    }

    const order = found[0];

    if (order.status !== 'pending') {
        logInfo('orderService: pedido não está pending', { orderId: order.id, status: order.status });
        if (order.status === 'processing') {
            await syncOrderToErpBestEffort(order.id);
        }
        return { kind: 'already', orderId: order.id, status: order.status ?? 'unknown' };
    }

    if (typeof payment.value === 'number' && Number.isFinite(payment.value)) {
        const expected = Number(order.totalAmount);
        if (Number.isFinite(expected) && Math.abs(payment.value - expected) > AMOUNT_TOLERANCE) {
            logError('orderService: VALOR DIVERGENTE', {
                orderId: order.id,
                expected,
                received: payment.value,
            });
            return {
                kind: 'amount_mismatch',
                orderId: order.id,
                expected,
                received: payment.value,
            };
        }
    } else {
        logInfo('orderService: payment.value ausente — sem conferência de valor', {
            orderId: order.id,
        });
    }

    const updated = await db
        .update(orders)
        .set({ status: 'processing' })
        .where(and(eq(orders.status, 'pending'), eq(orders.id, order.id)))
        .returning({ id: orders.id });

    if (updated.length === 0) {
        logInfo('orderService: race — nenhum pending atualizado', { orderId: order.id });
        return { kind: 'already', orderId: order.id, status: 'race' };
    }

    logInfo('orderService: pedido marcado como pago', { orderId: updated[0].id });
    await syncOrderToErpBestEffort(updated[0].id);
    return { kind: 'paid', orderId: updated[0].id };
}

/** Reembolso / chargeback: cancela e devolve estoque. */
export async function markOrderRefunded(payment: PaymentRef): Promise<void> {
    const condition = refCondition(payment);
    if (!condition) {
        logInfo('orderService: reembolso sem referência', payment.paymentId);
        return;
    }

    const found = await db
        .select({ id: orders.id, status: orders.status, items: orders.items })
        .from(orders)
        .where(condition)
        .limit(1);

    if (found.length === 0) {
        logInfo('orderService: reembolso sem pedido', { payment: payment.paymentId });
        return;
    }

    const order = found[0];
    if (order.status === 'cancelled') {
        logInfo('orderService: reembolso já cancelado', { orderId: order.id });
        return;
    }

    await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, order.id));
    logInfo('orderService: pedido cancelado (reembolso)', { orderId: order.id });

    const items = order.items as Array<{
        id: string;
        variantId?: string | null;
        quantity: number;
    }> | null;

    if (!items || !Array.isArray(items)) return;

    for (const item of items) {
        if (!item.id || !item.quantity) continue;
        const ok = item.variantId
            ? await incrementVariantStockDb(item.variantId, item.quantity)
            : await incrementStockDb(item.id, item.quantity);
        if (ok) {
            logInfo('orderService: estoque restaurado', {
                productId: item.id,
                variantId: item.variantId ?? null,
                qty: item.quantity,
            });
        } else {
            logError('orderService: falha ao restaurar estoque', {
                productId: item.id,
                variantId: item.variantId ?? null,
                qty: item.quantity,
            });
        }
    }
}

/** Grava referência do gateway no pedido (webhook usa externalReference ou payment_ref). */
export async function attachPaymentRef(orderId: string, paymentRef: string): Promise<void> {
    try {
        await db.update(orders).set({ paymentRef }).where(eq(orders.id, orderId));
    } catch (e) {
        logError('orderService: falha ao gravar payment_ref', e);
    }
}

export interface ExpireResult {
    found: number;
    cancelled: number;
    failed: number;
    ttlHours: number;
}

/** Cancela pending mais velhos que o TTL (estoque + cupom via SQL). */
export async function expireStalePendingOrders(options?: {
    ttlHours?: number;
    maxBatch?: number;
}): Promise<ExpireResult> {
    const ttlHours = Math.max(1, options?.ttlHours ?? Number(process.env.PENDING_ORDER_TTL_HOURS) || 2);
    const maxBatch = options?.maxBatch ?? 50;
    const cutoffDate = new Date(Date.now() - ttlHours * 60 * 60 * 1000);

    const stale = await db
        .select({ id: orders.id, couponCode: orders.couponCode })
        .from(orders)
        .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoffDate)))
        .limit(maxBatch);

    let cancelled = 0;
    let failed = 0;

    for (const row of stale) {
        const ok = await cancelPendingOrderDb(row.id, row.couponCode ?? null);
        if (ok) cancelled++;
        else failed++;
    }

    logInfo('orderService: expire lote', { found: stale.length, cancelled, failed, ttlHours });
    return { found: stale.length, cancelled, failed, ttlHours };
}
