/* global process */
import crypto from 'node:crypto'

/**
 * Comparação de strings em tempo constante (evita timing attacks).
 */
function safeEqual(a, b) {
    const bufA = Buffer.from(String(a))
    const bufB = Buffer.from(String(b))
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Valida uma chave interna (webhooks/ERP/processos internos) de forma FAIL-CLOSED.
 *
 * @param {string} provided  Valor recebido (ex.: header Authorization completo, ou token).
 * @param {string} expected  Valor esperado (ex.: `Bearer ${INTERNAL_API_KEY}`).
 * @returns {boolean} true só quando o segredo existe e bate exatamente.
 *
 * Regra: se o segredo esperado não estiver configurado, retorna SEMPRE false
 * (nunca "libera em dev"). Rotas de escrita sensível não devem ter bypass.
 */
export function isAuthorizedInternal(provided, expected) {
    if (!expected || !provided) return false
    return safeEqual(provided, expected)
}
