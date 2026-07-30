/**
 * Montagem e interpretação de dados do checkout — pura, sem I/O.
 */
import type { CreateOrderParams } from './orderDb';

export interface CouponRule {
    code: string | null;
    discount: number;
    singleUse: boolean;
    minCartTotal: number | null;
}

export interface CreateOrderInput {
    userId: string | null;
    items: Array<{ id: string | number; quantity: number; variantId?: string }>;
    coupon: CouponRule;
    paymentMethod?: 'credit' | 'pix';
    shipping?: Record<string, unknown>;
    customerEmail?: string;
}

export function buildCreateOrderParams(input: CreateOrderInput): CreateOrderParams {
    return {
        userId: input.userId ?? null,
        items: input.items.map((i) => ({
            id: String(i.id),
            quantity: i.quantity,
            variantId: i.variantId ?? null,
        })),
        couponCode: input.coupon.code,
        discount: input.coupon.discount,
        singleUse: input.coupon.singleUse,
        minCartTotal: input.coupon.minCartTotal,
        paymentMethod: input.paymentMethod ?? 'unknown',
        shipping: input.shipping ?? null,
        guestEmail: input.userId ? null : input.customerEmail || 'guest@lyvest.com.br',
    };
}

export function normalizeCreateOrderResult(
    rpc: { orderId?: unknown; total?: unknown } | null | undefined,
    fallbackTotal: number
): { orderId: string | null; total: number } {
    return {
        orderId: rpc?.orderId ? String(rpc.orderId) : null,
        total: typeof rpc?.total === 'number' ? rpc.total : fallbackTotal,
    };
}

export function buildSessionMetadata(input: {
    userId: string | null;
    appliedCoupon: string | null;
    orderId: string | null;
    originHeader: string | null;
    requestUrl: string;
    customerEmail?: string | null;
    customerName?: string | null;
}): Record<string, string> {
    return {
        source: 'lyvest',
        verified: 'true',
        userId: input.userId || 'guest',
        coupon: input.appliedCoupon || '',
        orderId: input.orderId || '',
        appUrl: input.originHeader ?? new URL(input.requestUrl).origin,
        customerEmail: input.customerEmail || '',
        customerName: input.customerName || '',
    };
}

export function usesInvertedOrderFlow(rawProvider: string | undefined): boolean {
    return (rawProvider || 'mock').toLowerCase() === 'asaas';
}
