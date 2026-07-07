/* global process */
import { z } from 'zod'
import allowCors from '../_utils/cors'
import { getPaymentProvider } from '../_services/payment'
import { supabase } from '../_lib/supabase'
import { logError } from '../_utils/logger'
import { limitOr429 } from '../_utils/rateLimit'

// Define validation schema - we only trust IDs and Quantities from frontend
const paymentSchema = z.object({
    items: z.array(z.object({
        id: z.string().or(z.number()),
        quantity: z.number().int().positive()
    })).min(1, { message: "Cart cannot be empty" }),
    currency: z.string().length(3).optional().default('BRL')
})

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    // Rate limit (Cofre): protege a criação de sessão de pagamento contra abuso.
    if (!(await limitOr429(req, res, 'checkout'))) return

    try {
        // 1. Validate Input Structure
        const result = paymentSchema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                message: 'Invalid input',
                errors: result.error.flatten().fieldErrors
            })
        }

        const { items: frontendItems, currency } = result.data

        // 2. FETCH REAL PRICES FROM SUPABASE (CRITICAL SECURITY FIX)
        const productIds = frontendItems.map(item => item.id)
        const { data: dbProducts, error: dbError } = await supabase
            .from('products')
            .select('id, name, price, promotional_price')
            .in('id', productIds)

        if (dbError || !dbProducts || dbProducts.length === 0) {
            logError('create-session: DB error or products not found', dbError)
            return res.status(500).json({ message: 'Failed to verify product information' })
        }

        // 3. Reconstruct items with DB prices
        const verifiedItems = frontendItems.map(fItem => {
            const dbProduct = dbProducts.find(p => String(p.id) === String(fItem.id))
            if (!dbProduct) throw new Error(`Product ${fItem.id} not found in database`)

            // Use promotional price if available, otherwise regular price
            const activePrice = dbProduct.promotional_price || dbProduct.price

            return {
                id: dbProduct.id,
                name: dbProduct.name,
                price: Number(activePrice),
                quantity: fItem.quantity
            }
        })

        // 4. Delegate to the active Payment Provider
        const paymentProvider = getPaymentProvider()

        // Add branding metadata for Ly Vest
        const sessionOptions = {
            items: verifiedItems,
            currency,
            metadata: {
                source: 'Ecommerce-Ly-Vest-Nino',
                verified: 'true'
            }
        }

        const session = await paymentProvider.createSession(sessionOptions)

        return res.status(200).json({
            success: true,
            data: session
        })

    } catch (error) {
        logError('create-session: unexpected error', error)
        return res.status(500).json({
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
}

export default allowCors(handler)
