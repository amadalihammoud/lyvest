/**
 * Interpretação do evento de estoque do ERP — pura, sem I/O.
 *
 * Extraída de src/app/api/erp/webhook-stock/route.ts: era a maior parte da
 * complexidade daquele handler (cadeias de `??` para tolerar os dois formatos
 * do Bling) e a parte que mais precisava de teste, já que interpreta payload
 * vindo de fora e o resultado grava estoque.
 *
 * Formatos aceitos:
 *  - Bling v3: { data: { produto: { id }, saldoVirtualTotal } }
 *  - Genérico: { blingId | idProduto, saldo | quantity }
 */
export interface StockEvent {
    /** id do produto no Bling (products.bling_id) */
    blingId: number;
    /** saldo já normalizado: inteiro, nunca negativo */
    saldo: number;
}

type Rec = Record<string, unknown>;

const asRecord = (v: unknown): Rec =>
    v !== null && typeof v === 'object' ? (v as Rec) : {};

/**
 * Converte para número SEM os buracos do `Number()` cru.
 *
 * `Number(null)` é 0 e `Number('')` é 0 — num campo de saldo, ambos zerariam o
 * estoque do produto a partir de um payload praticamente vazio. Aqui só número
 * e string numérica não-vazia passam.
 */
function toNumber(v: unknown): number | null {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
        const s = v.trim();
        if (s === '') return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

/** @returns o evento normalizado, ou null quando o payload não é utilizável. */
export function parseStockEvent(payload: unknown): StockEvent | null {
    const root = asRecord(payload);
    const d = asRecord(root.data ?? root);
    const produto = asRecord(d.produto);

    const blingId = toNumber(produto.id ?? d.blingId ?? d.idProduto);
    const saldo = toNumber(d.saldoVirtualTotal ?? d.saldo ?? d.quantity);

    // id do Bling é sempre inteiro positivo; qualquer outra coisa é payload
    // malformado e não deve virar um UPDATE.
    if (blingId === null || !Number.isInteger(blingId) || blingId <= 0) return null;
    if (saldo === null) return null;

    return { blingId, saldo: Math.max(0, Math.trunc(saldo)) };
}
