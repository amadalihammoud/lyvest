-- ============================================================================
-- LY VEST — SCHEMA CONSOLIDADO PARA NEON (Postgres puro, sem Supabase)
-- Consolida: SUPABASE_SETUP.sql + migrations 002–013.
-- Diferenças em relação ao Supabase:
--   * SEM RLS e SEM clerk_uid(): o browser nunca acessa o banco. Toda query
--     passa por API routes Next.js que validam o usuário via Clerk (auth()).
--   * create_order recebe p_user_id como parâmetro — preenchido pelo SERVIDOR
--     a partir do token Clerk, nunca pelo cliente.
--   * Sem GRANTs de PostgREST (anon/authenticated não existem no Neon).
-- Idempotente.
-- ============================================================================

-- ============ TABELAS ============

CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT NOT NULL PRIMARY KEY,          -- Clerk user id ('user_...')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    cpf TEXT,
    birth_date DATE,
    gender TEXT,
    marketing_email BOOLEAN DEFAULT true,
    marketing_whatsapp BOOLEAN DEFAULT true,
    terms_accepted_at TIMESTAMPTZ           -- LGPD (migration 003)
);

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    promotional_price DECIMAL(10,2),        -- migration 009 (NULL = sem promoção)
    image_url TEXT,
    category_id UUID REFERENCES categories(id),
    active BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    highlight BOOLEAN DEFAULT false,
    sizes TEXT[] DEFAULT '{"P","M","G","GG"}' -- migration 011
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,                            -- Clerk id ou 'guest:<email>'
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    tracking_code TEXT,
    shipping_address JSONB,
    items JSONB,
    payment_ref TEXT                         -- migration 010 (correlação Asaas)
);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
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

CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_favorites_user_product UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS financial_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rule_key TEXT NOT NULL UNIQUE,
    rule_value DECIMAL(10,2) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    order_id TEXT,
    product_id UUID,
    product_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    approved BOOLEAN DEFAULT true
);

-- Cupom de uso único (migration 005) — a UNIQUE garante atomicidade sob concorrência.
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    coupon_code TEXT NOT NULL,
    user_id TEXT NOT NULL,
    order_id TEXT,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_coupon_per_user UNIQUE (coupon_code, user_id)
);

-- ============ ÍNDICES ============
CREATE INDEX IF NOT EXISTS idx_addresses_user_id  ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id  ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON orders(payment_ref);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product    ON reviews(product_id);

-- ============ FUNÇÕES ============

-- Baixa atômica de estoque (migrations 005/007). Condição DENTRO do UPDATE:
-- duas compras simultâneas nunca deixam estoque negativo.
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;
  UPDATE products SET stock = stock - p_qty
   WHERE id = p_id AND stock >= p_qty;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Reposição atômica (estorno/reembolso — migration 012).
CREATE OR REPLACE FUNCTION increment_stock(p_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;
  UPDATE products SET stock = stock + p_qty WHERE id = p_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Criação atômica de pedido (migrations 008/013, adaptada para Neon).
-- MUDANÇA vs Supabase: identidade vem de p_user_id, preenchido PELO SERVIDOR
-- (Clerk auth() na API route). O cliente continua mandando só id+quantity;
-- preços são relidos do banco (Zero-Trust preservado).
CREATE OR REPLACE FUNCTION create_order(
    p_user_id        TEXT,    -- Clerk id (server-side) ou NULL p/ convidado
    p_items          JSONB,   -- [{"id":"<uuid>","quantity":<int>}]
    p_coupon_code    TEXT,
    p_discount       NUMERIC, -- fração 0..1 já validada no servidor
    p_single_use     BOOLEAN,
    p_min_cart_total NUMERIC,
    p_payment_method TEXT,
    p_shipping       JSONB,
    p_guest_email    TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_user     TEXT := p_user_id;
    v_item     JSONB;
    v_pid      UUID;
    v_qty      INT;
    v_price    NUMERIC;
    v_name     TEXT;
    v_subtotal NUMERIC := 0;
    v_discount NUMERIC := COALESCE(p_discount, 0);
    v_total    NUMERIC;
    v_order_id UUID;
    v_snapshot JSONB := '[]'::jsonb;
BEGIN
    IF v_user IS NULL OR v_user = '' THEN
        IF p_guest_email IS NOT NULL AND p_guest_email <> '' THEN
            v_user := 'guest:' || lower(trim(p_guest_email));
        ELSE
            RAISE EXCEPTION 'AUTH_REQUIRED';
        END IF;
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_pid := (v_item->>'id')::uuid;
        v_qty := (v_item->>'quantity')::int;

        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'INVALID_QTY';
        END IF;

        -- Preço efetivo: promotional_price tem prioridade quando não-nulo.
        SELECT COALESCE(promotional_price, price), name INTO v_price, v_name
          FROM products
         WHERE id = v_pid AND active = true;

        IF v_price IS NULL THEN
            RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', v_pid;
        END IF;

        UPDATE products SET stock = stock - v_qty
         WHERE id = v_pid AND stock >= v_qty;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_pid;
        END IF;

        v_subtotal := v_subtotal + v_price * v_qty;
        v_snapshot := v_snapshot || jsonb_build_object(
            'id', v_pid, 'name', v_name, 'price', v_price, 'quantity', v_qty,
            'size', v_item->>'size'
        );
    END LOOP;

    IF v_discount > 0 AND p_min_cart_total IS NOT NULL AND v_subtotal < p_min_cart_total THEN
        v_discount := 0;
    END IF;

    v_total := GREATEST(0, ROUND(v_subtotal * (1 - v_discount), 2));

    IF v_discount > 0 AND p_single_use IS TRUE
       AND p_coupon_code IS NOT NULL AND length(p_coupon_code) > 0 THEN
        INSERT INTO coupon_redemptions (coupon_code, user_id)
        VALUES (upper(p_coupon_code), v_user);
    END IF;

    INSERT INTO orders (user_id, status, total_amount, payment_method, shipping_address, items)
    VALUES (v_user, 'pending', v_total, COALESCE(p_payment_method, 'unknown'), p_shipping, v_snapshot)
    RETURNING id INTO v_order_id;

    RETURN jsonb_build_object('orderId', v_order_id, 'subtotal', v_subtotal, 'total', v_total);
END;
$$;
