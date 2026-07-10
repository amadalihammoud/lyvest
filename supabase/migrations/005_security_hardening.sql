-- Migration 005: Blindagem de segurança (Pilares 2 e 3 da skill ecommerce-security)
-- Execute no SQL Editor do Supabase. Idempotente onde possível.
--
-- Conteúdo:
--   1. RPC atômica de decremento de estoque (evita race condition / estoque negativo).
--   2. Tabela coupon_redemptions (cupom de uso único, garantido por UNIQUE).
--   3. Reconciliação da RLS de `addresses` para o modelo Clerk (public.clerk_uid()),
--      alinhando com SUPABASE_CLERK_MIGRATION.sql (antes usava auth.uid() UUID).

-- Pré-requisito: a função public.clerk_uid() já deve existir (ver SUPABASE_SETUP.sql /
-- SUPABASE_CLERK_MIGRATION.sql). Recriada aqui por segurança/idempotência.
CREATE OR REPLACE FUNCTION public.clerk_uid() RETURNS TEXT AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::text;
$$ LANGUAGE sql STABLE;

-- =====================================================================
-- 1. Decremento atômico de estoque (Pilar 2 — Race Conditions)
-- =====================================================================
-- Decrementa apenas se houver estoque suficiente. Retorna TRUE se decrementou,
-- FALSE caso contrário. A condição vive DENTRO do UPDATE (nunca read-then-write).
CREATE OR REPLACE FUNCTION public.decrement_stock(p_id BIGINT, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.products
     SET stock = stock - p_qty
   WHERE id = p_id
     AND stock >= p_qty;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 2. Cupom de uso único (Pilar 2 — concorrência via constraint UNIQUE)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  coupon_code  TEXT NOT NULL,
  user_id      TEXT NOT NULL,              -- Clerk sub (TEXT)
  order_id     TEXT,
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 1 uso por usuário por cupom. Para uso único GLOBAL, troque por UNIQUE(coupon_code).
  CONSTRAINT uq_coupon_per_user UNIQUE (coupon_code, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user
  ON public.coupon_redemptions(user_id);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- O usuário só enxerga os próprios resgates. A escrita deve ser feita pelo backend
-- (server-side, no momento do checkout) — o INSERT que violar a UNIQUE falha atomicamente.
DROP POLICY IF EXISTS "User View Own Redemptions" ON public.coupon_redemptions;
CREATE POLICY "User View Own Redemptions" ON public.coupon_redemptions
  FOR SELECT USING (public.clerk_uid() = user_id);

DROP POLICY IF EXISTS "User Insert Own Redemptions" ON public.coupon_redemptions;
CREATE POLICY "User Insert Own Redemptions" ON public.coupon_redemptions
  FOR INSERT WITH CHECK (public.clerk_uid() = user_id);

-- =====================================================================
-- 3. Reconciliar RLS de `addresses` para o modelo Clerk (Pilar 3)
-- =====================================================================
-- A migration 004 criou policies com auth.uid() (UUID). O app usa Clerk (TEXT).
-- Removemos as policies antigas, migramos a coluna e recriamos com clerk_uid().

DROP POLICY IF EXISTS "Users can view own addresses"   ON public.addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;

-- Postgres bloqueia ALTER COLUMN TYPE em coluna referenciada por policy (0A000):
-- as policies "novas" também precisam cair ANTES do ALTER (podem existir se o banco
-- nasceu do SUPABASE_SETUP.sql, que já as cria).
DROP POLICY IF EXISTS "User View Own Addresses"   ON public.addresses;
DROP POLICY IF EXISTS "User Manage Own Addresses" ON public.addresses;

-- Remover FK para auth.users e migrar tipo do user_id para TEXT (Clerk sub).
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE public.addresses ALTER COLUMN user_id TYPE TEXT USING user_id::text;

DROP POLICY IF EXISTS "User View Own Addresses"   ON public.addresses;
DROP POLICY IF EXISTS "User Manage Own Addresses" ON public.addresses;
CREATE POLICY "User View Own Addresses" ON public.addresses
  FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Manage Own Addresses" ON public.addresses
  FOR ALL USING (public.clerk_uid() = user_id) WITH CHECK (public.clerk_uid() = user_id);
