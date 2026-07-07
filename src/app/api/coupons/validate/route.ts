import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateCoupon } from '@/config/coupons';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/coupons/validate
 *
 * Valida um cupom de desconto no servidor. Os códigos e percentuais ficam SOMENTE no
 * servidor (src/config/coupons.ts) — nunca expostos no bundle do cliente.
 *
 * Body: { code: string, cartTotal?: number }
 * Response: { valid: boolean; discount: number; message: string }
 */

// Pilar 5: validação de entrada com Zod (nunca apenas typeof).
const bodySchema = z.object({
    code: z.string().min(1).max(32),
    cartTotal: z.number().nonnegative().optional(),
});

export async function POST(request: NextRequest) {
    // Pilar 4 (Cofre): rate limit em rota transacional; catálogo (Vitrine) fica livre.
    const ip = getClientIp(request.headers);
    const rl = await checkRateLimit(ip, 'coupon');
    if (!rl.success) {
        return NextResponse.json(
            { valid: false, discount: 0, message: 'Muitas tentativas. Tente novamente em instantes.' },
            { status: 429 }
        );
    }

    try {
        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { valid: false, discount: 0, message: 'Digite um código válido.' },
                { status: 400 }
            );
        }

        const { code, cartTotal = 0 } = parsed.data;
        const result = validateCoupon(code, cartTotal);

        // Cupom inexistente/inelegível não é erro de servidor: 200 com valid=false.
        return NextResponse.json(
            { valid: result.valid, discount: result.discount, message: result.message },
            { status: 200 }
        );
    } catch {
        return NextResponse.json(
            { valid: false, discount: 0, message: 'Erro ao validar cupom.' },
            { status: 500 }
        );
    }
}
