/* global process */
import crypto from 'node:crypto'
import allowCors from '../_utils/cors'
import { markEventProcessed } from '../_utils/idempotency'
import { logError, logInfo } from '../_utils/logger'

// Requer o corpo bruto (raw) para verificar a assinatura HMAC.
export const config = {
    api: {
        bodyParser: false,
    },
}

function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
    })
}

/**
 * Verificação genérica HMAC-SHA256 do corpo bruto, em tempo constante.
 * Compatível com provedores que assinam o payload (Stripe/InfinitePay/Mercado Pago
 * usam variações; ajuste o header/algoritmo conforme o provedor ativo).
 */
function verifySignature(rawBody, signature, secret) {
    if (!secret || !signature) return false
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(expected)
    const b = Buffer.from(String(signature))
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    const rawBody = await readRawBody(req)
    const secret = process.env.PAYMENT_WEBHOOK_SECRET
    const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature']
    const isProd = process.env.NODE_ENV === 'production'

    // --- GATE DE SEGURANÇA: assinatura fail-closed em produção ---
    if (isProd) {
        if (!secret) {
            // Sem segredo configurado em produção, não há como confiar no evento.
            logError('webhook: PAYMENT_WEBHOOK_SECRET ausente em produção')
            return res.status(500).json({ error: 'Webhook not configured' })
        }
        if (!verifySignature(rawBody, signature, secret)) {
            logError('webhook: assinatura inválida')
            return res.status(401).json({ error: 'Invalid signature' })
        }
    } else if (secret && signature) {
        // Fora de produção: se houver segredo + assinatura, ainda validamos (modo mock aceita sem).
        if (!verifySignature(rawBody, signature, secret)) {
            return res.status(401).json({ error: 'Invalid signature' })
        }
    }

    let event
    try {
        event = JSON.parse(rawBody.toString('utf8') || '{}')
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' })
    }

    try {
        // --- IDEMPOTÊNCIA: dedupe por ID do evento (evita processar 2x) ---
        const eventId = event.id || event.data?.object?.id
        const isNew = await markEventProcessed(eventId, 'payment')
        if (!isNew) {
            logInfo('webhook: evento duplicado ignorado', eventId)
            return res.status(200).json({ received: true, duplicate: true })
        }

        switch (event.type) {
            case 'payment_intent.succeeded':
            case 'order.paid': {
                const intent = event.data?.object || event.data
                logInfo('webhook: pagamento capturado', intent?.id)
                // TODO: atualizar status do pedido para 'paid' e disparar ERP sync
                // (a atualização deve ser atômica/idempotente — ver Pilar 2 da skill).
                break
            }

            case 'payment_intent.payment_failed': {
                const failed = event.data?.object || event.data
                logInfo('webhook: pagamento falhou', failed?.id)
                break
            }

            default:
                logInfo('webhook: tipo de evento não tratado', event.type)
        }

        // 200 confirma o recebimento e evita retentativas do provedor.
        return res.status(200).json({ received: true })
    } catch (err) {
        logError('webhook: erro ao processar evento', err)
        return res.status(400).json({ error: 'Webhook processing error' })
    }
}

export default allowCors(handler)
