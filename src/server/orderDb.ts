/**
 * Chamadas server-side às funções SQL do Neon (antes RPCs do Supabase).
 * A identidade do usuário é passada explicitamente pelo chamador (Clerk auth()),
 * nunca vinda do cliente.
 */
import { logError } from '../lib/server/logger';

import { sql } from './dbClient';

export interface CreateOrderParams {
    userId: string | null;              // Clerk id; null para convidado
    items: Array<{ id: string; quantity: number; size?: string }>;
    couponCode: string | null;
    discount: number;                   // fração 0..1 já validada no servidor
    singleUse: boolean;
    minCartTotal: number | null;
    paymentMethod: string;
    shipping: unknown;
    guestEmail?: string | null;
}

export interface CreateOrderResult {
    orderId: string;
    subtotal: number;
    total: number;
}

/** Cria pedido atômico via função SQL create_order. Lança o erro do Postgres em falha. */
export async function createOrderDb(p: CreateOrderParams): Promise<CreateOrderResult> {
    const rows = await sql`
        SELECT create_order(
            ${p.userId},
            ${JSON.stringify(p.items)}::jsonb,
            ${p.couponCode},
            ${p.discount},
            ${p.singleUse},
            ${p.minCartTotal},
            ${p.paymentMethod},
            ${p.shipping === null || p.shipping === undefined ? null : JSON.stringify(p.shipping)}::jsonb,
            ${p.guestEmail ?? null}
        ) AS result
    `;
    return rows[0]?.result as CreateOrderResult;
}

/** Baixa atômica de estoque. Retorna false se estoque insuficiente. */
export async function decrementStockDb(productId: string, qty: number): Promise<boolean> {
    const rows = await sql`SELECT decrement_stock(${productId}::uuid, ${qty}) AS ok`;
    return Boolean(rows[0]?.ok);
}

/** Reposição atômica de estoque (estorno/reembolso). */
export async function incrementStockDb(productId: string, qty: number): Promise<boolean> {
    try {
        const rows = await sql`SELECT increment_stock(${productId}::uuid, ${qty}) AS ok`;
        return Boolean(rows[0]?.ok);
    } catch (e) {
        logError('orderDb: increment_stock falhou', e);
        return false;
    }
}
