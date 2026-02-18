/* global process */
import { z } from 'zod'
import allowCors from '../_utils/cors'
import { withRateLimit, couponLimiter } from '../_utils/rate-limit'

// Coupon definitions - server-side only (not exposed to browser)
const VALID_COUPONS = {
    'BEMVINDA10': { discount: 0.10, description: '10% de desconto' },
    'LYVEST2026': { discount: 0.15, description: '15% de desconto' },
    'PROMO5': { discount: 0.05, description: '5% de desconto' },
}

const couponSchema = z.object({
    code: z.string().min(1).max(50).transform(val => val.toUpperCase().trim())
})

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    try {
        const result = couponSchema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                valid: false,
                message: 'Código de cupom inválido.'
            })
        }

        const { code } = result.data
        const coupon = VALID_COUPONS[code]

        if (coupon) {
            return res.status(200).json({
                valid: true,
                code,
                discount: coupon.discount,
                description: coupon.description,
                message: `Cupom ${code} válido! ${coupon.description}`
            })
        }

        return res.status(200).json({
            valid: false,
            message: 'Cupom inválido ou expirado.'
        })

    } catch (error) {
        console.error('Coupon Validation Error:', error)
        return res.status(500).json({
            valid: false,
            message: 'Erro interno ao validar cupom.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
}

export default allowCors(withRateLimit(couponLimiter)(handler))
