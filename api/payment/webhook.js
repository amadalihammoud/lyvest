import allowCors from '../utils/cors'

// This would be your real Stripe/Gateway secret from env
// const ENDPOINT_SECRET = process.env.WEBHOOK_SECRET

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    const event = req.body

    try {
        // --- SECURITY: VERIFY SIGNATURE ---
        // In production, you MUST verify the signature to ensure the request is from Stripe/InfinitePay
        // const signature = req.headers['stripe-signature']
        // event = stripe.webhooks.constructEvent(req.body, signature, ENDPOINT_SECRET)

        // For now, we assume the body IS the event (Mock mode)
        // console.log('Webhook received:', event.type)

        switch (event.type) {
            case 'payment_intent.succeeded':
            case 'order.paid': { // Generic event name
                const paymentIntent = event.data?.object || event.data
                console.log('💰 Payment captured!', paymentIntent.id)

                // TODO: Update database status to 'paid'
                // TODO: Trigger ERP Sync (Next Phase)
                // await syncOrderToERP(paymentIntent)
                break
            }

            case 'payment_intent.payment_failed': {
                const paymentFailed = event.data?.object || event.data
                console.log('❌ Payment failed:', paymentFailed.id)
                // TODO: Notify user via email
                break
            }

            default:
                console.log(`Unhandled event type ${event.type}`)
        }

        // Return 200 to acknowledge receipt immediately (prevents retries)
        return res.status(200).json({ received: true })

    } catch (err) {
        console.error(`Webhook Error: ${err.message}`)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }
}

// Config required to consume raw body for signature verification (Vercel specific)
export const config = {
    api: {
        bodyParser: true, // Set to false if you need raw body for Stripe signature verification manually
    },
}

export default allowCors(handler)
