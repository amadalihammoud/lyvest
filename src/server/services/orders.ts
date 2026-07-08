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
 * Verifica se um usuário JÁ resgatou um cupom (para enforcar uso único no momento de
 * aplicar o desconto — a UNIQUE só barra linhas duplicadas, não o desconto em si).
 *
 * Retorna true apenas quando temos certeza de um resgate prévio. Sem service-role,
 * retorna false (fail-open: a UNIQUE no resgate segue como backstop no pagamento).
 * Nota: continua havendo uma janela TOCTOU entre sessões concorrentes; a garantia
 * atômica final é a UNIQUE(coupon_code,user_id) em coupon_redemptions.
 */
export async function couponAlreadyRedeemed(
    userId: string | null,
    code: string
): Promise<boolean> {
    if (!supabaseAdmin || !userId) return false;
    try {
        const { data, error } = await supabaseAdmin
            .from('coupon_redemptions')
            .select('id')
            .eq('coupon_code', code)
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();
        if (error) {
            logError('orders.couponAlreadyRedeemed: erro na consulta', error);
            return false;
        }
        return Boolean(data);
    } catch (err) {
        logError('orders.couponAlreadyRedeemed: erro inesperado', err);
        return false;
    }
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
                // Coluna dedicada — mark_order_paid a lê no resgate de uso único.
                coupon_code: input.coupon ?? null,
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

/** Resultado do fulfillment: status do RPC, 'skipped' (no-op fail-safe) ou null (falha recuperável). */
export type FulfillResult = 'paid' | 'already_paid' | 'not_found' | 'skipped' | null;

/**
 * Marca o pedido como pago de forma atômica e idempotente (decremento de estoque +
 * resgate de cupom via RPC mark_order_paid).
 * - 'skipped' => sem service-role/orderNumber (no-op seguro; NÃO é falha).
 * - null      => admin configurado mas o RPC/DB falhou (o caller deve pedir retry).
 * - 'paid' | 'already_paid' | 'not_found' => resultado do RPC.
 */
export async function fulfillOrderPaid(orderNumber: string | undefined | null): Promise<FulfillResult> {
    if (!supabaseAdmin || !orderNumber) return 'skipped';

    try {
        const { data, error } = await supabaseAdmin.rpc('mark_order_paid', {
            p_order_number: orderNumber,
        });
        if (error) {
            logError('orders.fulfillOrderPaid: RPC mark_order_paid falhou', error);
            return null;
        }
        logInfo('orders.fulfillOrderPaid: resultado', `${orderNumber} -> ${data}`);
        return typeof data === 'string' ? (data as FulfillResult) : null;
    } catch (err) {
        logError('orders.fulfillOrderPaid: erro inesperado', err);
        return null;
    }
}
