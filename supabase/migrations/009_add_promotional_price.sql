-- Migration 009: Garante a coluna products.promotional_price
-- --------------------------------------------------------------------------------------------
-- O código de checkout (api/payment/create-session e a RPC de pedido) sempre leu
-- products.promotional_price (preço promocional tem prioridade sobre price), mas o schema-base
-- (SUPABASE_SETUP.sql / migration 001) nunca criou a coluna. Em produção, o SELECT desse campo
-- falharia. Esta migração adiciona a coluna se ela não existir.
--
-- Semântica: NULL = sem promoção (usa price). Valor não-nulo = preço promocional ativo.
-- Idempotente.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS promotional_price DECIMAL(10,2);

COMMENT ON COLUMN public.products.promotional_price IS
    'Preço promocional (tem prioridade sobre price quando não-nulo). NULL = sem promoção.';
