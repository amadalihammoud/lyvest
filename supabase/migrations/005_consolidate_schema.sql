-- ==============================================================================
-- MIGRATION 005: Consolidação de Schema
-- Reconcilia 001_initial_schema.sql com setup_database.sql
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÕES FINANCEIRAS (do setup_database.sql)
-- Necessária para cálculo de taxas no checkout
CREATE TABLE IF NOT EXISTS financial_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_key TEXT NOT NULL UNIQUE,
    rule_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE financial_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public Read Financial Configs"
    ON financial_configs FOR SELECT USING (true);

-- 2. TABELA DE CATEGORIAS (do setup_database.sql)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public Read Categories"
    ON categories FOR SELECT USING (true);

-- 3. TABELA DE PRODUTOS (consolidada)
-- Combina campos de ambos os schemas
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bling_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    promotional_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    weight DECIMAL(10,3),
    dimensions JSONB,
    images TEXT[],
    category_id UUID REFERENCES categories(id),
    slug TEXT UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public Read Products"
    ON products FOR SELECT USING (true);

-- 4. ADICIONAR COLUNAS FALTANTES NA TABELA ORDERS (se já existir)
-- Do setup_database.sql: payment_id, tracking_code, invoice_url
-- Do 001_initial_schema.sql: order_number, subtotal, shipping_cost, discount
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_snapshot JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. INDEXES PARA QUERIES FREQUENTES
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- 6. SEED DE CATEGORIAS (idempotente)
INSERT INTO categories (name, slug) VALUES
    ('Lingerie', 'lingerie'),
    ('Sutiãs', 'sutias'),
    ('Calcinhas', 'calcinhas'),
    ('Pijamas', 'pijamas')
ON CONFLICT (slug) DO NOTHING;

-- 7. SEED DE CONFIGURAÇÕES FINANCEIRAS (idempotente)
INSERT INTO financial_configs (rule_key, rule_value, description) VALUES
    ('fee_credit_1x', '{"percent": 4.99}', 'Taxa Mercado Pago Crédito à vista'),
    ('fee_credit_installments', '{"percent_base": 4.99, "percent_per_month": 1.5}', 'Taxa Mercado Pago Parcelado'),
    ('fee_pix', '{"percent": 0.99}', 'Taxa Mercado Pago PIX')
ON CONFLICT (rule_key) DO NOTHING;
