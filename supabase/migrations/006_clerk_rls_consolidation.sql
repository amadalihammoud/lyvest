-- Migration 006: Consolidação canônica do RLS para o modelo Clerk (Pilar 3 — Controle de Acesso)
-- --------------------------------------------------------------------------------------------
-- Contexto do problema que esta migração resolve:
--   As migrations 001 e 004 criaram policies com `auth.uid()` (Supabase Auth nativo, tipo UUID).
--   O app, porém, autentica com Clerk, cujo id de usuário é TEXT (ex.: 'user_2 abc...').
--   Resultado: `auth.uid() = user_id` nunca casa e, sem o JWT do Clerk chegando ao Postgres,
--   `public.clerk_uid()` retornava NULL — deixando o RLS ou quebrado (nega tudo) ou, se
--   afrouxado manualmente, aberto (dados de todos expostos pela anon key pública).
--
-- Esta migração é a FONTE ÚNICA DA VERDADE do RLS. Ela:
--   1. (Re)cria a função public.clerk_uid() que lê o claim `sub` do JWT do Clerk.
--   2. Remove TODAS as policies legadas (auth.uid()) das tabelas de usuário.
--   3. Recria as policies canônicas escopadas por public.clerk_uid() = user_id.
--   4. Reafirma as leituras públicas do catálogo (Vitrine).
--
-- PRÉ-REQUISITO DE INFRA (fora do SQL, feito UMA vez no painel do Supabase):
--   Authentication → Sign In / Providers → adicionar o Clerk como Third-Party Auth provider,
--   usando o domínio do Clerk. Sem isso, o Supabase não valida o JWT do Clerk e o RLS
--   continua negando tudo. Ver docs/SECURITY_RLS.md.
--
-- Idempotente: pode ser reexecutada com segurança.

-- =====================================================================
-- 0. Função de identidade — lê o `sub` do JWT do Clerk
-- =====================================================================
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
-- 1. Garantir tipos TEXT nas colunas user_id (Clerk sub) e sem FK para auth.users
-- =====================================================================
ALTER TABLE public.addresses  DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE public.favorites  DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.orders     DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.reviews    DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE public.addresses  ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.favorites  ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.orders     ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.reviews    ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- =====================================================================
-- 2. Remover policies legadas (auth.uid()) e quaisquer variações antigas
-- =====================================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','orders','addresses','favorites','reviews','coupon_redemptions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- =====================================================================
-- 3. Garantir RLS habilitado nas tabelas de usuário
-- =====================================================================
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews    ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 4. Policies canônicas — escopadas por public.clerk_uid()
-- =====================================================================

-- PROFILES
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (public.clerk_uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (public.clerk_uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (public.clerk_uid() = id) WITH CHECK (public.clerk_uid() = id);

-- ORDERS (escrita real de pedido deve ser server-side; aqui o dono lê os próprios)
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (public.clerk_uid() = user_id);

-- ADDRESSES
CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "addresses_write_own" ON public.addresses
  FOR ALL USING (public.clerk_uid() = user_id) WITH CHECK (public.clerk_uid() = user_id);

-- FAVORITES
CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "favorites_write_own" ON public.favorites
  FOR ALL USING (public.clerk_uid() = user_id) WITH CHECK (public.clerk_uid() = user_id);

-- REVIEWS: leitura pública apenas de aprovadas; escrita só do próprio usuário.
-- (A verificação de compra e a moderação são feitas server-side — ver rota de reviews.)
CREATE POLICY "reviews_select_approved" ON public.reviews
  FOR SELECT USING (approved = true OR public.clerk_uid() = user_id);
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (public.clerk_uid() = user_id);

-- =====================================================================
-- 5. Leituras públicas do catálogo (Vitrine) — reafirmadas de forma idempotente
-- =====================================================================
DROP POLICY IF EXISTS "Public Categories Access" ON public.categories;
DROP POLICY IF EXISTS "Public Products Access"   ON public.products;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (active = true);

-- =====================================================================
-- Como validar (obrigatório após aplicar):
--   1. Logar como usuário A, criar um endereço.
--   2. Logar como usuário B; tentar SELECT/UPDATE/DELETE no id do endereço de A.
--   3. Esperado: A não enxerga/altera nada de B (retorno vazio, nunca erro 500).
-- =====================================================================
