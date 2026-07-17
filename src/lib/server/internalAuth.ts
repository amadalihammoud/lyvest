import crypto from 'node:crypto';

/**
 * Comparação de strings em tempo constante (evita timing attacks).
 */
function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Valida uma chave interna (webhooks/ERP/processos internos) de forma FAIL-CLOSED.
 *
 * @param provided  Valor recebido (ex.: header Authorization completo, ou token).
 * @param expected  Valor esperado (ex.: `Bearer ${INTERNAL_API_KEY}`).
 * @returns true só quando o segredo existe e bate exatamente.
 *
 * Regra: se o segredo esperado não estiver configurado, retorna SEMPRE false
 * (nunca "libera em dev"). Rotas de escrita sensível não devem ter bypass.
 */
export function isAuthorizedInternal(provided: string, expected: string): boolean {
    if (!expected || !provided) return false;
    return safeEqual(provided, expected);
}
