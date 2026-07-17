-- Migration 010: coluna de correlação pedido ↔ gateway (Asaas)
-- --------------------------------------------------------------------------------------------
-- O fluxo invertido de pagamento cria o pedido (status pending) ANTES da sessão de
-- pagamento e grava aqui o id do link/cobrança do gateway (ex.: paymentLink do Asaas).
-- O webhook usa payment.externalReference (= orders.id) e, como fallback,
-- payment.paymentLink (= orders.payment_ref) para localizar o pedido e marcá-lo pago.
-- Idempotente.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON public.orders(payment_ref);

COMMENT ON COLUMN public.orders.payment_ref IS
'ID do link/cobrança no gateway de pagamento (ex.: paymentLink do Asaas) para correlação de webhook.';
