/**
 * Logger seguro para as rotas de API / código server-side.
 *
 * - Em desenvolvimento: loga contexto + detalhes completos.
 * - Em produção: loga apenas o contexto (mensagem estática). NUNCA loga PII, IP,
 *   corpo de requisição ou stack completa, para evitar vazamento em provedores de log.
 */
const isDev = process.env.NODE_ENV === 'development';

export function logError(context: string, detail?: unknown): void {
    if (isDev) {
        console.error(`[ERR] ${context}`, detail ?? '');
    } else {
        // Produção: só o rótulo do erro, sem detalhe sensível.
        console.error(`[ERR] ${context}`);
    }
}

export function logInfo(context: string, detail?: unknown): void {
    if (isDev) {
        // eslint-disable-next-line no-console
        console.log(`[INFO] ${context}`, detail ?? '');
    }
}

/**
 * Retorna o campo `details` de uma resposta de erro somente em desenvolvimento.
 * Use para nunca vazar error.message ao cliente em produção.
 */
export function errorDetails(error: unknown): string | undefined {
    return isDev ? (error instanceof Error ? error.message : undefined) : undefined;
}
