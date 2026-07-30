/**
 * Envia um pedido local (já pago) ao Bling como pedido de venda.
 *
 * Idempotência: se orders.erp_order_id já existe, não reenvia.
 * Correlação: grava o id retornado pelo Bling em erp_order_id.
 * Contato: CPF/nome de profiles (Clerk) quando houver; senão destinatário + guest email.
 */
import { eq, inArray } from 'drizzle-orm';

import { orders, productVariants, products, profiles } from '../../db/schema';
import { logError, logInfo } from '../../lib/server/logger';
import { db } from '../dbClient';
import type { ErpOrderData, ErpSyncResult } from '../providers/erp';
import { blingPost, isBlingConfigured } from './client';
import {
    buildBlingOrderPayload,
    type OrderItemForBling,
    type OrderShippingForBling,
} from './orderPayload';

interface LocalOrderRow {
    id: string;
    createdAt: Date | null;
    userId: string | null;
    totalAmount: string;
    paymentMethod: string | null;
    shippingAddress: unknown;
    items: unknown;
    erpOrderId: string | null;
}

interface SnapshotItem {
    id?: string;
    variantId?: string | null;
    name?: string;
    price?: number | string;
    quantity?: number;
    sku?: string | null;
}

function parseShipping(raw: unknown): OrderShippingForBling | null {
    if (!raw || typeof raw !== 'object') return null;
    const s = raw as Record<string, unknown>;
    return {
        price: Number(s.price ?? 0) || 0,
        recipient: s.recipient != null ? String(s.recipient) : undefined,
        street: s.street != null ? String(s.street) : undefined,
        number: s.number != null ? String(s.number) : undefined,
        complement: s.complement != null ? String(s.complement) : undefined,
        neighborhood: s.neighborhood != null ? String(s.neighborhood) : undefined,
        city: s.city != null ? String(s.city) : undefined,
        state: s.state != null ? String(s.state) : undefined,
        zipCode: s.zipCode != null ? String(s.zipCode) : s.cep != null ? String(s.cep) : undefined,
    };
}

function guestEmailFromUserId(userId: string | null): string | null {
    if (!userId) return null;
    if (userId.startsWith('guest:')) return userId.slice('guest:'.length) || null;
    return null;
}

async function loadProfileContact(
    userId: string | null
): Promise<{ name: string | null; cpf: string | null }> {
    if (!userId || userId.startsWith('guest:')) {
        return { name: null, cpf: null };
    }
    try {
        const rows = await db
            .select({ fullName: profiles.fullName, cpf: profiles.cpf })
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);
        const row = rows[0];
        return {
            name: row?.fullName?.trim() || null,
            cpf: row?.cpf?.trim() || null,
        };
    } catch {
        return { name: null, cpf: null };
    }
}

async function resolveBlingIds(snapshot: SnapshotItem[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    const variantIds = snapshot.map((i) => i.variantId).filter((id): id is string => Boolean(id));
    const productIds = snapshot.map((i) => i.id).filter((id): id is string => Boolean(id));

    if (variantIds.length > 0) {
        const rows = await db
            .select({ id: productVariants.id, blingId: productVariants.blingId })
            .from(productVariants)
            .where(inArray(productVariants.id, variantIds));
        for (const r of rows) {
            if (r.blingId) map.set(`v:${r.id}`, r.blingId);
        }
    }

    if (productIds.length > 0) {
        const rows = await db
            .select({ id: products.id, blingId: products.blingId })
            .from(products)
            .where(inArray(products.id, productIds));
        for (const r of rows) {
            if (r.blingId) map.set(`p:${r.id}`, r.blingId);
        }
    }

    return map;
}

async function loadOrder(orderId: string): Promise<LocalOrderRow | null> {
    const rows = await db
        .select({
            id: orders.id,
            createdAt: orders.createdAt,
            userId: orders.userId,
            totalAmount: orders.totalAmount,
            paymentMethod: orders.paymentMethod,
            shippingAddress: orders.shippingAddress,
            items: orders.items,
            erpOrderId: orders.erpOrderId,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
    return rows[0] ?? null;
}

export async function sendLocalOrderToBling(orderId: string): Promise<ErpSyncResult> {
    if (!isBlingConfigured()) {
        return {
            success: false,
            provider: 'bling',
            erpReferenceId: '',
            message: 'Bling não configurado (CLIENT_ID/SECRET)',
        };
    }

    const order = await loadOrder(orderId);
    if (!order) {
        return {
            success: false,
            provider: 'bling',
            erpReferenceId: '',
            message: `Pedido ${orderId} não encontrado`,
        };
    }

    if (order.erpOrderId) {
        logInfo('bling/sendOrder: já sincronizado', { orderId, erpOrderId: order.erpOrderId });
        return {
            success: true,
            provider: 'bling',
            erpReferenceId: order.erpOrderId,
            message: 'Já sincronizado anteriormente',
        };
    }

    const snapshot = (Array.isArray(order.items) ? order.items : []) as SnapshotItem[];
    const blingMap = await resolveBlingIds(snapshot);

    const items: OrderItemForBling[] = snapshot.map((i) => {
        const blingProductId =
            (i.variantId && blingMap.get(`v:${i.variantId}`)) ||
            (i.id && blingMap.get(`p:${i.id}`)) ||
            null;
        return {
            name: i.name || 'Produto',
            quantity: Number(i.quantity) || 0,
            price: Number(i.price) || 0,
            sku: i.sku ?? null,
            blingProductId,
        };
    });

    const shipping = parseShipping(order.shippingAddress);
    const profile = await loadProfileContact(order.userId);
    const lojaId = Number(process.env.BLING_LOJA_ID) || null;

    // Documento: só de profiles.cpf (nunca inventar). Nome: destinatário > profile > fallback.
    const customerName =
        shipping?.recipient?.trim() || profile.name || 'Cliente LyVest';

    const payload = buildBlingOrderPayload({
        orderId: order.id,
        createdAt: order.createdAt,
        customerName,
        customerDocument: profile.cpf,
        customerEmail: guestEmailFromUserId(order.userId),
        items,
        shipping,
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        lojaId: lojaId && lojaId > 0 ? lojaId : null,
    });

    try {
        const res = await blingPost<{ data?: { id?: number | string } }>('/pedidos/vendas', payload);
        const erpId = res?.data?.id != null ? String(res.data.id) : '';

        if (!erpId) {
            logError('bling/sendOrder: resposta sem id', res);
            return {
                success: false,
                provider: 'bling',
                erpReferenceId: '',
                message: 'Bling respondeu sem id do pedido',
            };
        }

        await db
            .update(orders)
            .set({ erpOrderId: erpId, erpSyncedAt: new Date() })
            .where(eq(orders.id, order.id));

        logInfo('bling/sendOrder: pedido criado no ERP', { orderId: order.id, erpId });
        return {
            success: true,
            provider: 'bling',
            erpReferenceId: erpId,
            message: 'Pedido enviado ao Bling',
        };
    } catch (e) {
        logError('bling/sendOrder: falha', e);
        return {
            success: false,
            provider: 'bling',
            erpReferenceId: '',
            message: e instanceof Error ? e.message.slice(0, 200) : 'Falha ao enviar ao Bling',
        };
    }
}

export async function sendOrderFromErpData(orderData: ErpOrderData): Promise<ErpSyncResult> {
    const id = orderData.id != null ? String(orderData.id) : '';
    if (!id) {
        return {
            success: false,
            provider: 'bling',
            erpReferenceId: '',
            message: 'orderData.id ausente',
        };
    }
    return sendLocalOrderToBling(id);
}
