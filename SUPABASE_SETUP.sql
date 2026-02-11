-- 🏗️ LY VEST DATABASE SETUP (Clerk Compatible)
-- --------------------------------------------------------
-- Este script cria todas as tabelas necessárias para o E-commerce Ly Vest.
-- Adaptado para funcionar com autenticação via Clerk (IDs como TEXT).
-- Copie e cole todo o conteúdo abaixo no "SQL Editor" do Supabase e clique em "RUN".

-- 1. LIMPEZA (Se quiser começar do zero, descomente as linhas abaixo)
-- DROP TABLE IF EXISTS public.reviews;
-- DROP TABLE IF EXISTS public.favorites;
-- DROP TABLE IF EXISTS public.addresses;
-- DROP TABLE IF EXISTS public.orders;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.financial_configs;
-- DROP TABLE IF EXISTS public.profiles;

-- 2. CRIAÇÃO DAS TABELAS

-- CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
);

-- PERFIS DE USUÁRIO (IDs são strings do Clerk, ex: 'user_2...')
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    cpf TEXT,
    birth_date DATE,
    gender TEXT
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

-- 3. SEGURANÇA (RLS - ROW LEVEL SECURITY)

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_configs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO PÚBLICO (Leitura)
CREATE POLICY "Public Categories Access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Products Access" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Public Financial Configs" ON public.financial_configs FOR SELECT USING (true);

-- POLÍTICAS DE ACESSO PRIVADO (Usuário logado via Clerk)
-- Utilizamos (auth.jwt() ->> 'sub') para pegar o ID do usuário do token Clerk

-- Perfil
CREATE POLICY "User View Own Profile" ON public.profiles FOR SELECT USING ((select auth.jwt() ->> 'sub') = id);
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING ((select auth.jwt() ->> 'sub') = id);
CREATE POLICY "User Insert Own Profile" ON public.profiles FOR INSERT WITH CHECK ((select auth.jwt() ->> 'sub') = id);

-- Pedidos
CREATE POLICY "User View Own Orders" ON public.orders FOR SELECT USING ((select auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "User Create Orders" ON public.orders FOR INSERT WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

-- Endereços
CREATE POLICY "User View Own Addresses" ON public.addresses FOR SELECT USING ((select auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "User Manage Own Addresses" ON public.addresses FOR ALL USING ((select auth.jwt() ->> 'sub') = user_id);

-- Favoritos
CREATE POLICY "User View Own Favorites" ON public.favorites FOR SELECT USING ((select auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "User Manage Own Favorites" ON public.favorites FOR ALL USING ((select auth.jwt() ->> 'sub') = user_id);

-- 4. DADOS INICIAIS (SEED)

-- Inserir Categorias Básicas
INSERT INTO public.categories (name, slug, description) VALUES
('Sutiãs', 'sutias', 'Sutiãs confortáveis e elegantes'),
('Calcinhas', 'calcinhas', 'Calcinhas para o dia a dia e ocasiões especiais'),
('Kits', 'kits', 'Kits promocionais com o melhor custo-benefício'),
('Meias', 'meias', 'Meias invisíveis e confortáveis')
ON CONFLICT (slug) DO NOTHING;

-- Inserir Regras Financeiras
INSERT INTO public.financial_configs (rule_key, rule_value, description) VALUES
('free_shipping_threshold', 199.90, 'Valor mínimo para frete grátis'),
('pix_discount', 0.05, 'Desconto de 5% no PIX')
ON CONFLICT (rule_key) DO NOTHING;

-- Inserir Produtos de Exemplo
INSERT INTO public.products (name, slug, description, price, image_url, category_id, active, stock, highlight) 
VALUES
('Kit 3 Calcinhas Algodão Soft', 'kit-3-calcinhas-algodao-soft', 'Conforto absoluto para o dia a dia.', 49.90, 'https://images.unsplash.com/photo-1596482181829-415849dfc126?auto=format&fit=crop&q=80&w=800', (SELECT id FROM public.categories WHERE slug='kits' LIMIT 1), true, 100, true),
('Sutiã Renda Comfort Sem Bojo', 'sutia-renda-comfort-sem-bojo', 'Elegância e leveza sem abrir mão do suporte.', 59.90, 'https://images.unsplash.com/photo-1620331306121-6a0b1f6804a9?auto=format&fit=crop&q=80&w=800', (SELECT id FROM public.categories WHERE slug='sutias' LIMIT 1), true, 50, true),
('Cueca Boxer Feminina Modal', 'cueca-boxer-feminina-modal', 'Liberdade de movimento e toque suave.', 29.90, 'https://images.unsplash.com/photo-1616147690623-e1860d5b1285?auto=format&fit=crop&q=80&w=800', (SELECT id FROM public.categories WHERE slug='calcinhas' LIMIT 1), true, 200, false)
ON CONFLICT (slug) DO NOTHING;
