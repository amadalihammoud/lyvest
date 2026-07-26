/* global process */
/**
 * Guarda de idempotência para webhooks, usando o Upstash Redis via REST API.
 *
 * markEventProcessed(id) tenta gravar a chave do evento com SET NX (só cria se não existir).
 * Retorna:
 *   - true  => evento NOVO (deve ser processado)
 *   - false => evento DUPLICADO (já processado; ignore)
 *
 * Se o Redis não estiver configurado, retorna true (fail-open apenas para o dedupe,
 * para não travar o recebimento) — a verificação de assinatura continua sendo o gate real.
 */
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

// Fail-open barulhento: sem Redis em produção a deduplicação de webhook fica DESATIVADA,
// permitindo que um evento repetido seja processado mais de uma vez. Gritamos no log para
// que a má-configuração seja percebida (a assinatura continua sendo o gate de autenticidade).
if ((!REDIS_URL || !REDIS_TOKEN) && process.env.NODE_ENV === 'production') {
    console.error(
        '[SECURITY] Idempotência de webhook DESATIVADA em produção: Upstash Redis ausente. ' +
            'Eventos repetidos podem ser processados em duplicidade.'
    );
}

function keyFor(eventId: string, prefix: string): string {
    return `idem:${prefix}:${encodeURIComponent(eventId)}`;
}

export async function markEventProcessed(
    eventId: string | undefined | null,
    prefix = 'webhook'
): Promise<boolean> {
    if (!eventId) return true;
    if (!REDIS_URL || !REDIS_TOKEN) return true; // dedupe desabilitado sem Redis

    const key = keyFor(eventId, prefix);
    try {
        // SET key "1" NX EX <ttl> — cria só se não existir
        const url = `${REDIS_URL}/set/${key}/1?nx=true&ex=${TTL_SECONDS}`;
        const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        });
        const data = (await resp.json()) as { result?: string | null };
        // result === "OK" quando criou (novo); null quando já existia (duplicado)
        return data?.result === 'OK';
    } catch {
        // Em erro de infra, não bloqueia o recebimento (assinatura é o gate real)
        return true;
    }
}

/**
 * Libera a reserva feita por markEventProcessed.
 *
 * O SET NX é uma RESERVA, não um registro de "processado com sucesso". Se o
 * processamento falhar depois da reserva, a chave precisa ser apagada — senão o
 * reenvio do gateway cai no ramo "duplicado", devolve 200 e o efeito colateral
 * (ex.: marcar o pedido como pago) nunca acontece: o cliente paga e o pedido
 * fica preso em 'pending' para sempre.
 *
 * Best-effort: se o DEL falhar, o pior caso é o evento não ser reprocessado —
 * exatamente o comportamento anterior, nunca pior que ele.
 */
export async function releaseEventMark(
    eventId: string | undefined | null,
    prefix = 'webhook'
): Promise<void> {
    if (!eventId) return;
    if (!REDIS_URL || !REDIS_TOKEN) return;

    const key = keyFor(eventId, prefix);
    try {
        await fetch(`${REDIS_URL}/del/${key}`, {
            headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        });
    } catch {
        // silencioso por design — ver docstring
    }
}
