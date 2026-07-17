/**
 * Helpers compartilhados do fluxo de pedido (usados por /api/orders e
 * /api/payment/create-session). Fonte única — não duplicar nas rotas.
 */

import { VALID_COUPONS } from '../config/coupons';

/** Regras do cupom a partir da fonte única (servidor). O desconto/mínimo são
 *  REVALIDADOS contra o subtotal real dentro da RPC create_order. */
export function couponRuleFor(couponCode?: string): {
    code: string | null;
    discount: number;
    singleUse: boolean;
    minCartTotal: number;
} {
    const normalized = couponCode?.toUpperCase().trim();
    const coupon = normalized ? VALID_COUPONS[normalized] : undefined;
    if (!coupon || !normalized) {
        return { code: null, discount: 0, singleUse: false, minCartTotal: 0 };
    }
    return {
        code: normalized,
        discount: coupon.discount,
        singleUse: coupon.singleUse ?? false,
        minCartTotal: coupon.minCartTotal ?? 0,
    };
}

/** Mapeia exceções conhecidas da RPC create_order para mensagens seguras. */
export function messageForRpcError(raw: string): { status: number; message: string } {
    if (raw.includes('INSUFFICIENT_STOCK')) {
        return { status: 409, message: 'Um dos itens ficou sem estoque. Revise seu carrinho.' };
    }
    if (raw.includes('PRODUCT_NOT_FOUND')) {
        return { status: 400, message: 'Produto indisponível no carrinho.' };
    }
    if (raw.includes('AUTH_REQUIRED')) {
        return { status: 401, message: 'Sessão expirada. Entre novamente.' };
    }
    if (raw.includes('duplicate key') || raw.includes('coupon_redemptions')) {
        return { status: 409, message: 'Este cupom já foi utilizado.' };
    }
    return { status: 500, message: 'Não foi possível concluir o pedido.' };
}
