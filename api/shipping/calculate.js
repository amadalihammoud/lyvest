/* global process */
import { z } from 'zod'
import allowCors from '../utils/cors'
import { getShippingProvider } from '../services/shipping'

// Define validation schema for shipping
const shippingSchema = z.object({
    zipCode: z.string().regex(/^\d{8}$/, { message: "ZIP Code must be 8 digits (numeric)" }),
    items: z.array(z.object({
        id: z.string().or(z.number()),
        quantity: z.number().int().positive(),
        price: z.number().min(0)
    })).min(1, { message: "Items required for shipping calc" })
})

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    try {
        // 1. Zod Validation
        const result = shippingSchema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                message: 'Invalid input',
                errors: result.error.flatten().fieldErrors
            })
        }

        const { zipCode, items } = result.data

        // 2. Calculate using the active Shipping Provider
        const shippingProvider = getShippingProvider()
        const options = await shippingProvider.calculate({ zipCode, items })

        return res.status(200).json(options)

    } catch (error) {
        console.error('Shipping Calculation Error:', error)
        return res.status(500).json({
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
}

export default allowCors(handler)
