/**
 * Montagem e interpretação de dados do checkout — pura, sem I/O.
 *
 * A rota /api/payment/create-session acumulou 29 de complexidade porque
 * intercalava quatro coisas: decidir o fluxo, montar o payload de create_order,
 * interpretar o retorno da função SQL e montar o metadata do gateway. Só a
 * primeira e a terceira envolvem decisão de negócio; nenhuma envolve I/O.
 *
 * Separadas, viram teste barato. Juntas, verificar "convidado sem e-mail recebe
 * o endereço genérico" exigiria banco, Clerk e gateway de pé.
 */
import type { CreateOrderParams } from './orderDb';

/** Regra de cupom já resolvida no servidor (src/config/coupons.ts). */
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

/**
 * Payload de `create_order`.
 *
 * Pontos que não são cosméticos:
 *  - `id` vira string sempre: products.id é uuid, e um número aqui estoura no
 *    Postgres com "invalid input syntax for type uuid".
 *  - `variantId` ausente vira null explícito — a função SQL distingue "não
 *    mandou" de "mandou vazio" para decidir se exige a variante.
 *  - convidado sem e-mail recebe um endereço genérico em vez de null: a coluna
 *    guest_email é o único vínculo com um pedido sem conta.
 */
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

/**
 * Retorno de `create_order` → o que a rota usa.
 *
 * O total da função SQL VENCE o calculado localmente: ela é a autoridade final
 * de preço (lê a linha da variante quando existe, aplica cupom na mesma
 * transação que baixa estoque). O cálculo local só sobrevive se a função não
 * devolver um número — o que significaria que algo saiu do contrato.
 */
export function normalizeCreateOrderResult(
    rpc: { orderId?: unknown; total?: unknown } | null | undefined,
    fallbackTotal: number
): { orderId: string | null; total: number } {
    return {
        orderId: rpc?.orderId ? String(rpc.orderId) : null,
        total: typeof rpc?.total === 'number' ? rpc.total : fallbackTotal,
    };
}

/**
 * Metadata que viaja até o gateway e volta no webhook.
 *
 * Tudo string porque os gateways achatam metadata para texto — um null viraria
 * a string "null" no caminho de volta e o webhook procuraria um pedido com esse
 * id. Strings vazias são explícitas e inofensivas.
 *
 * `appUrl` sai do header Origin do request real, NÃO de NEXT_PUBLIC_APP_URL: no
 * preview da Vercel o host muda a cada branch, e a variável apontaria para o
 * lugar errado.
 */
export function buildSessionMetadata(input: {
    userId: string | null;
    appliedCoupon: string | null;
    orderId: string | null;
    originHeader: string | null;
    requestUrl: string;
}): Record<string, string> {
    return {
        source: 'lyvest',
        verified: 'true',
        userId: input.userId || 'guest',
        coupon: input.appliedCoupon || '',
        orderId: input.orderId || '',
        appUrl: input.originHeader ?? new URL(input.requestUrl).origin,
    };
}

/**
 * Se este provedor usa o fluxo invertido (pedido ANTES da sessão do gateway).
 *
 * Só o gateway real. No mock, o fluxo legado (wizard → /api/orders) continua
 * criando o pedido, e inverter aqui geraria pedido duplicado.
 */
export function usesInvertedOrderFlow(rawProvider: string | undefined): boolean {
    return (rawProvider || 'mock').toLowerCase() === 'asaas';
}
