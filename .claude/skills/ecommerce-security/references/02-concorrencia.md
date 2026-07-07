# Pilar 2 — Prevenção de Race Conditions (concorrência)

## O risco
Duas requisições simultâneas na mesma operação crítica podem: vender o mesmo item duas
vezes (estoque negativo), usar um cupom de uso único N vezes, ou processar o mesmo
pagamento em duplicidade. "Ler → decidir → escrever" **sem atomicidade** é a falha.

## Estoque: decremento atômico e condicional

Nunca faça `SELECT stock` → `if stock >= n` → `UPDATE stock = stock - n`. Faça a checagem
**dentro** da escrita atômica:

```sql
-- Atômico: só decrementa se houver estoque; retorna 0 linhas se faltar
UPDATE products
   SET stock = stock - :qty
 WHERE id = :id
   AND stock >= :qty;
```

Ou uma RPC no Supabase que encapsula a regra e roda como transação:

```sql
CREATE OR REPLACE FUNCTION public.decrement_stock(p_id BIGINT, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE ok BOOLEAN;
BEGIN
  UPDATE products SET stock = stock - p_qty
   WHERE id = p_id AND stock >= p_qty;
  GET DIAGNOSTICS ok = ROW_COUNT;
  RETURN ok > 0;         -- false = sem estoque suficiente
END; $$ LANGUAGE plpgsql;
```
```js
const { data: ok } = await supabase.rpc('decrement_stock', { p_id: id, p_qty: qty });
if (!ok) return res.status(409).json({ error: 'Estoque insuficiente' });
```

Para múltiplos itens, use `SELECT ... FOR UPDATE` dentro de uma transação/RPC para
travar as linhas antes de decidir.

## Cupom de uso único
Garanta por **constraint do banco**, não por leitura prévia:

```sql
CREATE TABLE coupon_redemptions (
  coupon_code TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  order_id    TEXT,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (coupon_code, user_id)   -- 1 uso por usuário; use UNIQUE(coupon_code) p/ global
);
```
O `INSERT` que violar a `UNIQUE` falha atomicamente → cupom não é reaplicado.

## Idempotência (pagamentos e webhooks)
- Gere uma **chave de idempotência** por tentativa de pagamento e persista o resultado;
  repetição com a mesma chave retorna o mesmo resultado, sem cobrar de novo.
- Webhooks: **deduplique pelo ID do evento** (armazene os já processados) antes de agir.

```js
// Webhook idempotente (pseudo)
if (await alreadyProcessed(event.id)) return res.status(200).json({ received: true });
await process(event);
await markProcessed(event.id);
```

## Checklist
- [ ] Decremento de estoque atômico/condicional (nunca read-then-write).
- [ ] Cupom único protegido por `UNIQUE`/transação.
- [ ] Pagamento com chave de idempotência.
- [ ] Webhook deduplicado por ID de evento.

## Como testar
- Dispare N requisições concorrentes de compra do último item → só **uma** conclui; as
  demais recebem 409. Estoque nunca fica negativo.
- Envie o mesmo webhook 2× → efeito colateral ocorre **uma** vez.
