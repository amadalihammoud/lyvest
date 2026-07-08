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

export async function markEventProcessed(eventId, prefix = 'webhook') {
    if (!eventId) return true;
    if (!REDIS_URL || !REDIS_TOKEN) return true; // dedupe desabilitado sem Redis

    const key = `idem:${prefix}:${encodeURIComponent(eventId)}`;
    try {
        // SET key "1" NX EX <ttl> — cria só se não existir
        const url = `${REDIS_URL}/set/${key}/1?nx=true&ex=${TTL_SECONDS}`;
        const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        });
        const data = await resp.json();
        // result === "OK" quando criou (novo); null quando já existia (duplicado)
        return data && data.result === 'OK';
    } catch {
        // Em erro de infra, não bloqueia o recebimento (assinatura é o gate real)
        return true;
    }
}
