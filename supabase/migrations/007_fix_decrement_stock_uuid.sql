-- Migration 007: Corrige o tipo do parâmetro de decrement_stock (Pilar 2 — Race Conditions)
-- --------------------------------------------------------------------------------------------
-- Bug corrigido: a migration 005 declarou decrement_stock(p_id BIGINT, ...), mas products.id
-- é UUID em todo o schema (SUPABASE_SETUP.sql, migration 001). Com o tipo errado, a chamada
-- da RPC falha por incompatibilidade de tipo e a baixa atômica de estoque — o controle de
-- race condition que evita venda de estoque negativo — nunca funciona.
--
-- Esta migração remove a versão BIGINT e cria a versão UUID, condicional e atômica
-- (a condição vive DENTRO do UPDATE, nunca read-then-write).
--
-- Idempotente.

-- Remove a assinatura antiga (BIGINT), se existir.
DROP FUNCTION IF EXISTS public.decrement_stock(BIGINT, INT);

-- Versão correta: p_id UUID.
CREATE OR REPLACE FUNCTION public.decrement_stock(p_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Decrementa apenas se houver estoque suficiente. A condição atômica no WHERE garante
  -- que duas requisições simultâneas nunca levem o estoque abaixo de zero.
  UPDATE public.products
     SET stock = stock - p_qty
   WHERE id = p_id
     AND stock >= p_qty;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Nota: `stock` deve existir em products (INTEGER). Ver SUPABASE_SETUP.sql.
