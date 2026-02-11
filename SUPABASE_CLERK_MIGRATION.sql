-- 🏗️ MIGRATION TO CLERK (PERMISSION FIXED)
-- --------------------------------------------------------
-- Este script adapta o banco de dados para usar autenticação do Clerk.
-- CORREÇÃO FINAL: Usamos 'public.clerk_uid()' em vez de 'auth.jwt()' para evitar erro de permissão.

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS (Limpeza inicial)
DROP POLICY IF EXISTS "User View Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "User Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "User Insert Own Profile" ON public.profiles;

DROP POLICY IF EXISTS "User View Own Orders" ON public.orders;
DROP POLICY IF EXISTS "User Create Orders" ON public.orders;

DROP POLICY IF EXISTS "User View Own Addresses" ON public.addresses;
DROP POLICY IF EXISTS "User Manage Own Addresses" ON public.addresses;

DROP POLICY IF EXISTS "User View Own Favorites" ON public.favorites;
DROP POLICY IF EXISTS "User Manage Own Favorites" ON public.favorites;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        DROP POLICY IF EXISTS "User Manage Own Reviews" ON public.reviews;
    END IF;
END $$;

-- 2. REMOVER CHAVES ESTRANGEIRES (FKs)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
    END IF;
END $$;

-- 3. ALTERAR IDs PARA TEXT
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.addresses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.favorites ALTER COLUMN user_id TYPE TEXT;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE public.reviews ALTER COLUMN user_id TYPE TEXT;
    END IF;
END $$;

-- 4. CRIAR FUNÇÃO NO SCHEMA PUBLIC (Evita erro de permissão no 'auth')
CREATE OR REPLACE FUNCTION public.clerk_uid() RETURNS TEXT AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::text;
$$ LANGUAGE sql STABLE;

-- 5. RECRIAR POLÍTICAS (Usando a nova função)

-- Perfil e Usuários
CREATE POLICY "User View Own Profile" ON public.profiles FOR SELECT USING (public.clerk_uid() = id);
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING (public.clerk_uid() = id);
CREATE POLICY "User Insert Own Profile" ON public.profiles FOR INSERT WITH CHECK (public.clerk_uid() = id);

-- Pedidos
CREATE POLICY "User View Own Orders" ON public.orders FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Create Orders" ON public.orders FOR INSERT WITH CHECK (public.clerk_uid() = user_id);

-- Endereços
CREATE POLICY "User View Own Addresses" ON public.addresses FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Manage Own Addresses" ON public.addresses FOR ALL USING (public.clerk_uid() = user_id);

-- Favoritos
CREATE POLICY "User View Own Favorites" ON public.favorites FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Manage Own Favorites" ON public.favorites FOR ALL USING (public.clerk_uid() = user_id);

-- Reviews
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        CREATE POLICY "User Manage Own Reviews" ON public.reviews FOR ALL USING (public.clerk_uid() = user_id);
    END IF;
END $$;
