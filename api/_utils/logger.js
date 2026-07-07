/* global process */
/**
 * Logger seguro para as funções serverless (api/*.js).
 *
 * - Em desenvolvimento: loga contexto + detalhes completos.
 * - Em produção: loga apenas o contexto (mensagem estática). NUNCA loga PII, IP,
 *   corpo de requisição ou stack completa, para evitar vazamento em provedores de log.
 *
 * Espelha a intenção de src/utils/logger.ts, mas sem depender do bundle TS do app.
 */
const isDev = process.env.NODE_ENV === 'development';

export function logError(context, detail) {
    if (isDev) {
        console.error(`[ERR] ${context}`, detail ?? '');
    } else {
        // Produção: só o rótulo do erro, sem detalhe sensível.
        console.error(`[ERR] ${context}`);
    }
}

export function logInfo(context, detail) {
    if (isDev) {
        console.log(`[INFO] ${context}`, detail ?? '');
    }
}

/**
 * Retorna o campo `details` de uma resposta de erro somente em desenvolvimento.
 * Use para nunca vazar error.message ao cliente em produção.
 */
export function errorDetails(error) {
    return isDev ? (error && error.message) : undefined;
}
