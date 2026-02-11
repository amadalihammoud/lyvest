-- 🏗️ MIGRATION TO CLERK (Run this in Supabase SQL Editor)
-- --------------------------------------------------------
-- Este script adapta o banco de dados para usar autenticação do Clerk.
-- 1. Remove as chaves estrangeiras para auth.users (Supabase Auth).
-- 2. Altera as colunas de ID de usuário para TEXT (para suportar IDs do Clerk).
-- 3. Atualiza as políticas de segurança (RLS) para usar o token JWT do Clerk.

-- ⚠️ IMPORTANTE: 
-- Você deve configurar o "JWT Secret" do Clerk nas configurações do Supabase:
-- Project Settings -> API -> JWT Settings -> Add new secret (use a chave do Clerk).

-- ========================================================
-- 1. PERFIS (PROFILES)
-- ========================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;

-- Atualizar Policies
DROP POLICY IF EXISTS "User View Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "User Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "User Insert Own Profile" ON public.profiles;

CREATE POLICY "User View Own Profile" ON public.profiles FOR SELECT USING ((select auth.jwt() ->> 'sub') = id);
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING ((select auth.jwt() ->> 'sub') = id);
CREATE POLICY "User Insert Own Profile" ON public.profiles FOR INSERT WITH CHECK ((select auth.jwt() ->> 'sub') = id);

-- ========================================================
-- 2. PEDIDOS (ORDERS)
-- ========================================================
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT;

-- Atualizar Policies
DROP POLICY IF EXISTS "User View Own Orders" ON public.orders;
DROP POLICY IF EXISTS "User Create Orders" ON public.orders;

CREATE POLICY "User View Own Orders" ON public.orders FOR SELECT USING ((select auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "User Create Orders" ON public.orders FOR INSERT WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

-- ========================================================
-- 3. ENDEREÇOS (ADDRESSES)
-- ========================================================
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE public.addresses ALTER COLUMN user_id TYPE TEXT;

-- Atualizar Policies
DROP POLICY IF EXISTS "User View Own Addresses" ON public.addresses;
DROP POLICY IF EXISTS "User Manage Own Addresses" ON public.addresses;

CREATE POLICY "User View Own Addresses" ON public.addresses FOR SELECT USING ((select auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "User Manage Own Addresses" ON public.addresses FOR ALL USING ((select auth.jwt() ->> 'sub') = user_id);

-- ========================================================
-- 4. FAVORITOS (FAVORITES)
-- ========================================================
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.favorites ALTER COLUMN user_id TYPE TEXT;

-- Atualizar Policies
DROP POLICY IF EXISTS "User View Own Favorites" ON public.favorites;
DROP POLICY IF EXISTS "User Manage Own Favorites" ON public.favorites;

CREATE POLICY "User View Own Favorites" ON public.favorites FOR SELECT USING ((select auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "User Manage Own Favorites" ON public.favorites FOR ALL USING ((select auth.jwt() ->> 'sub') = user_id);

-- ========================================================
-- 5. REVIEWS (Se existir)
-- ========================================================
-- Caso a tabela reviews exista e tenha referência ao user
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
        ALTER TABLE public.reviews ALTER COLUMN user_id TYPE TEXT;
        
        DROP POLICY IF EXISTS "User Manage Own Reviews" ON public.reviews;
        CREATE POLICY "User Manage Own Reviews" ON public.reviews FOR ALL USING ((select auth.jwt() ->> 'sub') = user_id);
    END IF;
END $$;
