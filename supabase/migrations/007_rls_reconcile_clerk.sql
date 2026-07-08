-- Migration 007: Reconciliar a RLS remanescente para o modelo Clerk (Pilar 3)
-- Execute no SQL Editor do Supabase DEPOIS da 006. Idempotente onde possível.
--
-- As migrações 005/006 já migraram addresses e orders/order_items/order_history para
-- public.clerk_uid(). Faltavam profiles, favorites e reviews, que ainda usavam auth.uid()
-- (Supabase-auth). Sob Clerk essas policies nunca batem => fail-closed (seguro, mas quebra
-- a funcionalidade). Aqui migramos os tipos e recriamos as policies com clerk_uid().
--
-- Pré-requisito: public.clerk_uid() (criada em 005).

-- =====================================================================
-- 1. profiles — PK 'id' = sub do Clerk (TEXT)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Remover FK para auth.users e migrar o tipo do id para TEXT (Clerk sub).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;

DROP POLICY IF EXISTS "User View Own Profile"   ON public.profiles;
DROP POLICY IF EXISTS "User Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "User Insert Own Profile" ON public.profiles;
CREATE POLICY "User View Own Profile"   ON public.profiles
  FOR SELECT USING (public.clerk_uid() = id);
CREATE POLICY "User Update Own Profile" ON public.profiles
  FOR UPDATE USING (public.clerk_uid() = id) WITH CHECK (public.clerk_uid() = id);
CREATE POLICY "User Insert Own Profile" ON public.profiles
  FOR INSERT WITH CHECK (public.clerk_uid() = id);

-- =====================================================================
-- 2. favorites — user_id = sub do Clerk (TEXT)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view their own favorites"   ON public.favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;

ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.favorites ALTER COLUMN user_id TYPE TEXT USING user_id::text;

DROP POLICY IF EXISTS "User View Own Favorites"   ON public.favorites;
DROP POLICY IF EXISTS "User Manage Own Favorites" ON public.favorites;
CREATE POLICY "User View Own Favorites"   ON public.favorites
  FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Manage Own Favorites" ON public.favorites
  FOR ALL USING (public.clerk_uid() = user_id) WITH CHECK (public.clerk_uid() = user_id);

-- =====================================================================
-- 3. reviews — leitura pública; escrita escopada pelo dono (TEXT)
-- =====================================================================
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
-- "Anyone can view reviews" (USING true) é mantida — catálogo/vitrine é público.

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews ALTER COLUMN user_id TYPE TEXT USING user_id::text;

DROP POLICY IF EXISTS "User Manage Own Reviews" ON public.reviews;
CREATE POLICY "User Manage Own Reviews" ON public.reviews
  FOR ALL USING (public.clerk_uid() = user_id) WITH CHECK (public.clerk_uid() = user_id);
