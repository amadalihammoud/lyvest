-- 🏗️ LY VEST DATABASE SETUP (Clerk Compatible - Final)
-- --------------------------------------------------------
-- Este script cria todas as tabelas e políticas necessárias
-- Compatível com Clerk e sem erros de permissão de schema

-- 1. LIMPEZA (Cuidado: apaga dados)
-- DROP TABLE IF EXISTS public.reviews;
-- DROP TABLE IF EXISTS public.favorites;
-- DROP TABLE IF EXISTS public.addresses;
-- DROP TABLE IF EXISTS public.orders;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.financial_configs;
-- DROP TABLE IF EXISTS public.profiles;

-- 2. FUNÇÃO AUXILIAR DE AUTENTICAÇÃO
-- Lê o ID do usuário do Token do Clerk (claim 'sub')
CREATE OR REPLACE FUNCTION public.clerk_uid() RETURNS TEXT AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::text;
$$ LANGUAGE sql STABLE;

-- 3. CRIAÇÃO DAS TABELAS

-- CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
);

-- PERFIS (ID = ID do Clerk, ex: 'user_2...')
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    cpf TEXT,
    birth_date DATE,
    gender TEXT,
    marketing_email BOOLEAN DEFAULT true,
    marketing_whatsapp BOOLEAN DEFAULT true
);

-- PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id),
    active BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    highlight BOOLEAN DEFAULT false
);

-- PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT, -- ID do Clerk
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    tracking_code TEXT,
    shipping_address JSONB,
    items JSONB
);

-- ENDEREÇOS
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT, -- ID do Clerk
    recipient TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    is_default BOOLEAN DEFAULT false
);

-- FAVORITOS
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT, -- ID do Clerk
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE
);

-- CONFIGURAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS public.financial_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rule_key TEXT NOT NULL UNIQUE,
    rule_value DECIMAL(10,2) NOT NULL,
    description TEXT
);

-- AVALIAÇÕES
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT, -- ID do Clerk
    order_id TEXT, -- ID do Pedido
    product_id UUID, -- Se quiser linkar direto ao produto
    product_name TEXT, -- Fallback se não tiver ID
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    approved BOOLEAN DEFAULT true
);

-- 4. SEGURANÇA (RLS)

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas
CREATE POLICY "Public Categories Access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Products Access" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Public Financial Configs" ON public.financial_configs FOR SELECT USING (true);
CREATE POLICY "Public Reviews Access" ON public.reviews FOR SELECT USING (approved = true);

-- Políticas Privadas (Usando public.clerk_uid())
CREATE POLICY "User View Own Profile" ON public.profiles FOR SELECT USING (public.clerk_uid() = id);
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING (public.clerk_uid() = id);
CREATE POLICY "User Insert Own Profile" ON public.profiles FOR INSERT WITH CHECK (public.clerk_uid() = id);

CREATE POLICY "User View Own Orders" ON public.orders FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Create Orders" ON public.orders FOR INSERT WITH CHECK (public.clerk_uid() = user_id);

CREATE POLICY "User View Own Addresses" ON public.addresses FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Manage Own Addresses" ON public.addresses FOR ALL USING (public.clerk_uid() = user_id);

CREATE POLICY "User View Own Favorites" ON public.favorites FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Manage Own Favorites" ON public.favorites FOR ALL USING (public.clerk_uid() = user_id);

CREATE POLICY "User View Own Reviews" ON public.reviews FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Create Reviews" ON public.reviews FOR INSERT WITH CHECK (public.clerk_uid() = user_id);

-- 5. DADOS INICIAIS (SEED)

INSERT INTO public.categories (name, slug, description) VALUES
('Sutiãs', 'sutias', 'Sutiãs confortáveis e elegantes'),
('Calcinhas', 'calcinhas', 'Calcinhas para o dia a dia e ocasiões especiais'),
('Kits', 'kits', 'Kits promocionais com o melhor custo-benefício'),
('Meias', 'meias', 'Meias invisíveis e confortáveis')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.financial_configs (rule_key, rule_value, description) VALUES
('free_shipping_threshold', 199.90, 'Valor mínimo para frete grátis'),
('pix_discount', 0.05, 'Desconto de 5% no PIX')
ON CONFLICT (rule_key) DO NOTHING;
