import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/coupons/validate
 *
 * Valida um cupom de desconto no servidor.
 * Os códigos e percentuais ficam SOMENTE no servidor — nunca expostos no bundle do cliente.
 *
 * Body: { code: string, cartTotal?: number }
 * Response: { valid: boolean; discount: number; message: string }
 */

interface CouponDefinition {
    discount: number;       // 0.10 = 10%
    minCartTotal?: number;  // Valor mínimo do carrinho para usar o cupom
    maxUses?: number;       // Futuro: controle de uso via banco
}

// Cupons definidos apenas no servidor
const VALID_COUPONS: Record<string, CouponDefinition> = {
    BEMVINDA10:  { discount: 0.10 },
    LYVEST2026:  { discount: 0.15, minCartTotal: 50 },
    PROMO5:      { discount: 0.05 },
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const code: string = typeof body.code === 'string' ? body.code.toUpperCase().trim() : '';
        const cartTotal: number = typeof body.cartTotal === 'number' ? body.cartTotal : 0;

        if (!code) {
            return NextResponse.json(
                { valid: false, discount: 0, message: 'Digite um código válido.' },
                { status: 400 }
            );
        }

        const coupon = VALID_COUPONS[code];

        if (!coupon) {
            return NextResponse.json(
                { valid: false, discount: 0, message: 'Cupom inválido ou expirado.' },
                { status: 200 }
            );
        }

        if (coupon.minCartTotal && cartTotal < coupon.minCartTotal) {
            return NextResponse.json(
                {
                    valid: false,
                    discount: 0,
                    message: `Este cupom exige pedido mínimo de R$${coupon.minCartTotal.toFixed(2).replace('.', ',')}.`,
                },
                { status: 200 }
            );
        }

        return NextResponse.json({
            valid: true,
            discount: coupon.discount,
            message: `Cupom ${code} aplicado! (${coupon.discount * 100}% OFF)`,
        });
    } catch {
        return NextResponse.json(
            { valid: false, discount: 0, message: 'Erro ao validar cupom.' },
            { status: 500 }
        );
    }
}
