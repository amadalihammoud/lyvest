-- 0010 — correlação pedido local ↔ pedido de venda no Bling.
-- Usado após webhook de pagamento para não reenviar o mesmo pedido ao ERP.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS erp_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS erp_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_erp_pending
    ON orders (created_at)
    WHERE status = 'processing' AND erp_order_id IS NULL;
