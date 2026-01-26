-- Script SQL para criar tabelas no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de Perfis (estende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    full_name TEXT,
    cpf TEXT,
    phone TEXT,
    birth_date DATE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Endereços
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    recipient TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method JSONB,
    shipping_address JSONB,
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2),
    tracking_code TEXT,
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10,2),
    quantity INTEGER,
    image_url TEXT
);

-- 5. Tabela de Histórico do Pedido
CREATE TABLE IF NOT EXISTS order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Favoritos
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    product_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 7. Tabela de Avaliações (para V1)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    product_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- ROW LEVEL SECURITY (RLS)
-- ==============================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para ADDRESSES
CREATE POLICY "Users can view their own addresses"
    ON addresses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own addresses"
    ON addresses FOR ALL
    USING (auth.uid() = user_id);

-- Políticas para ORDERS
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Políticas para ORDER_ITEMS (via relação com orders)
CREATE POLICY "Users can view items of their own orders"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Políticas para ORDER_HISTORY (via relação com orders)
CREATE POLICY "Users can view history of their own orders"
    ON order_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_history.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Políticas para FAVORITES
CREATE POLICY "Users can view their own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
    ON favorites FOR ALL
    USING (auth.uid() = user_id);

-- Políticas para REVIEWS
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own reviews"
    ON reviews FOR ALL
    USING (auth.uid() = user_id);

-- ==============================
-- TRIGGER para criar perfil automaticamente
-- ==============================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
