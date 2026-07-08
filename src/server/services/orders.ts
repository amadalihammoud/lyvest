// src/server/services/orders.ts
// Camada de fulfillment de pedido (Pilares 1/2 da skill ecommerce-security).
//
// Fecha F1/F2 da security-review:
//   - persistPendingOrder: grava o pedido 'pending' com itens JÁ verificados no servidor
//     (preços relidos do banco em create-session). Fonte da verdade = servidor.
//   - fulfillOrderPaid: no pagamento aprovado (webhook), chama o RPC atômico/idempotente
//     mark_order_paid, que decrementa estoque e registra o resgate de cupom de uso único.
//
// Fail-safe: se o client service-role não estiver configurado (SUPABASE_SERVICE_ROLE_KEY),
// todas as funções viram no-op e não quebram o checkout existente.

import { logError, logInfo } from '../../lib/server/logger';
import { supabaseAdmin } from '../supabaseAdmin';

export interface VerifiedOrderItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
}

export interface PendingOrderInput {
    orderNumber: string;
    userId: string | null;
    items: VerifiedOrderItem[];
    subtotal: number;
    discount: number;
    total: number;
    /** Código do cupom já revalidado no servidor (para resgate de uso único no pagamento). */
    coupon?: string | null;
}

/**
 * Persiste o pedido 'pending' + itens usando o client service-role.
 * Retorna true se persistiu, false se pulou (sem admin) ou falhou.
 */
export async function persistPendingOrder(input: PendingOrderInput): Promise<boolean> {
    if (!supabaseAdmin) return false; // fail-safe: fulfillment desativado sem service-role

    try {
        const { data: order, error: orderErr } = await supabaseAdmin
            .from('orders')
            .insert({
                order_number: input.orderNumber,
                user_id: input.userId,
                status: 'pending',
                subtotal: input.subtotal,
                discount: input.discount,
                total: input.total,
                // O cupom viaja em payment_method.coupon — mark_order_paid o lê no resgate.
                payment_method: input.coupon ? { coupon: input.coupon } : null,
            })
            .select('id')
            .single();

        if (orderErr || !order) {
            logError('orders.persistPendingOrder: falha ao inserir pedido', orderErr);
            return false;
        }

        const items = input.items.map((it) => ({
            order_id: order.id,
            product_id: typeof it.id === 'number' ? it.id : parseInt(String(it.id), 10),
            product_name: it.name,
            price: it.price,
            quantity: it.quantity,
        }));

        const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(items);
        if (itemsErr) {
            logError('orders.persistPendingOrder: falha ao inserir itens', itemsErr);
            return false;
        }

        logInfo('orders.persistPendingOrder: pedido pendente gravado', input.orderNumber);
        return true;
    } catch (err) {
        logError('orders.persistPendingOrder: erro inesperado', err);
        return false;
    }
}

/**
 * Marca o pedido como pago de forma atômica e idempotente (decremento de estoque +
 * resgate de cupom via RPC mark_order_paid). No-op sem service-role.
 * Retorna o status final do RPC ('paid' | 'already_paid' | 'not_found' | null).
 */
export async function fulfillOrderPaid(orderNumber: string | undefined | null): Promise<string | null> {
    if (!supabaseAdmin || !orderNumber) return null;

    try {
        const { data, error } = await supabaseAdmin.rpc('mark_order_paid', {
            p_order_number: orderNumber,
        });
        if (error) {
            logError('orders.fulfillOrderPaid: RPC mark_order_paid falhou', error);
            return null;
        }
        logInfo('orders.fulfillOrderPaid: resultado', `${orderNumber} -> ${data}`);
        return typeof data === 'string' ? data : null;
    } catch (err) {
        logError('orders.fulfillOrderPaid: erro inesperado', err);
        return null;
    }
}
