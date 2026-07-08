// src/config/coupons.ts
// FONTE ÚNICA DA VERDADE dos cupons — usada SOMENTE no servidor.
//
// Pilar 1 da skill ecommerce-security (Zero-Trust): códigos e percentuais NUNCA devem
// ser embutidos no bundle do cliente. O cliente valida cupom exclusivamente via
// POST /api/coupons/validate, que usa este módulo. Não importar este arquivo em
// componentes client-side.

export interface CouponDefinition {
    /** Percentual de desconto (0.10 = 10%). */
    discount: number;
    /** Valor mínimo do carrinho para o cupom ser aceito. */
    minCartTotal?: number;
    /** Uso único: quando true, exige registro em coupon_redemptions (ver migração). */
    singleUse?: boolean;
}

export const VALID_COUPONS: Record<string, CouponDefinition> = {
    BEMVINDA10: { discount: 0.10, singleUse: true },
    LYVEST2026: { discount: 0.15, minCartTotal: 50 },
    PROMO5: { discount: 0.05 },
};

export interface CouponValidationResult {
    valid: boolean;
    discount: number;
    message: string;
    singleUse?: boolean;
}

/**
 * Valida um cupom de forma pura (sem I/O). A verificação de uso único (single-use)
 * deve ser feita de forma atômica no banco (coupon_redemptions) no momento do checkout —
 * ver referência de concorrência (Pilar 2) da skill.
 */
export function validateCoupon(rawCode: string, cartTotal = 0): CouponValidationResult {
    const code = typeof rawCode === 'string' ? rawCode.toUpperCase().trim() : '';

    if (!code) {
        return { valid: false, discount: 0, message: 'Digite um código válido.' };
    }

    const coupon = VALID_COUPONS[code];
    if (!coupon) {
        return { valid: false, discount: 0, message: 'Cupom inválido ou expirado.' };
    }

    if (coupon.minCartTotal && cartTotal < coupon.minCartTotal) {
        const min = coupon.minCartTotal.toFixed(2).replace('.', ',');
        return { valid: false, discount: 0, message: `Este cupom exige pedido mínimo de R$${min}.` };
    }

    return {
        valid: true,
        discount: coupon.discount,
        message: `Cupom ${code} aplicado! (${coupon.discount * 100}% OFF)`,
        singleUse: coupon.singleUse,
    };
}
