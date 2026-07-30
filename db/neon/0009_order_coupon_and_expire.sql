-- 0009 — coupon_code no pedido + cancel_pending_order autossuficiente + índice p/ job.
--
-- PROBLEMA
-- cancel_pending_order precisava receber o cupom por parâmetro porque orders
-- não guardava o código. O job de expiração de pending não saberia o cupom
-- e deixaria cupom single-use queimado para sempre.
--
-- SOLUÇÃO
-- 1. Coluna orders.coupon_code
-- 2. create_order grava o cupom quando aplica desconto single-use (ou qualquer código)
-- 3. cancel_pending_order usa COALESCE(p_coupon_code, orders.coupon_code)
-- 4. Índice parcial em pending para o cron de expiração

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_pending_created
    ON orders (created_at)
    WHERE status = 'pending';

-- create_order: mesma lógica da 0008 + grava coupon_code
CREATE OR REPLACE FUNCTION create_order(
    p_user_id        TEXT,
    p_items          JSONB,
    p_coupon_code    TEXT,
    p_discount       NUMERIC,
    p_single_use     BOOLEAN,
    p_min_cart_total NUMERIC,
    p_payment_method TEXT,
    p_shipping       JSONB,
    p_guest_email    TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_user        TEXT := p_user_id;
    v_item        JSONB;
    v_pid         UUID;
    v_vid         UUID;
    v_qty         INT;
    v_price       NUMERIC;
    v_name        TEXT;
    v_size        TEXT;
    v_color       TEXT;
    v_sku         TEXT;
    v_has_variants BOOLEAN;
    v_prod_price  NUMERIC;
    v_subtotal    NUMERIC := 0;
    v_discount    NUMERIC := COALESCE(p_discount, 0);
    v_shipping    NUMERIC := 0;
    v_total       NUMERIC;
    v_order_id    UUID;
    v_snapshot    JSONB := '[]'::jsonb;
    v_coupon      TEXT;
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

    BEGIN
        v_shipping := COALESCE((p_shipping->>'price')::numeric, 0);
    EXCEPTION WHEN others THEN
        v_shipping := 0;
    END;
    IF v_shipping < 0 OR v_shipping > 500 THEN
        RAISE EXCEPTION 'INVALID_SHIPPING';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_pid := (v_item->>'id')::uuid;
        v_qty := (v_item->>'quantity')::int;
        v_vid := NULLIF(v_item->>'variantId', '')::uuid;

        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'INVALID_QTY';
        END IF;

        SELECT CASE
                   WHEN promotional_price IS NOT NULL AND promotional_price > 0
                   THEN promotional_price
                   ELSE price
               END, name
          INTO v_prod_price, v_name
          FROM products
         WHERE id = v_pid AND active = true;

        IF v_prod_price IS NULL THEN
            RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', v_pid;
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM product_variants WHERE product_id = v_pid AND active
        ) INTO v_has_variants;

        IF v_has_variants THEN
            IF v_vid IS NULL THEN
                RAISE EXCEPTION 'VARIANT_REQUIRED:%', v_pid;
            END IF;

            SELECT CASE
                       WHEN promotional_price IS NOT NULL AND promotional_price > 0
                       THEN promotional_price
                       WHEN price IS NOT NULL AND price > 0
                       THEN price
                       ELSE v_prod_price
                   END, size, color, sku
              INTO v_price, v_size, v_color, v_sku
              FROM product_variants
             WHERE id = v_vid AND product_id = v_pid AND active = true;

            IF v_price IS NULL THEN
                RAISE EXCEPTION 'VARIANT_NOT_FOUND:%', v_vid;
            END IF;

            UPDATE product_variants SET stock = stock - v_qty
             WHERE id = v_vid AND stock >= v_qty;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_pid;
            END IF;
        ELSE
            v_price := v_prod_price;
            v_size  := NULL;
            v_color := NULL;
            v_sku   := NULL;

            UPDATE products SET stock = stock - v_qty
             WHERE id = v_pid AND stock >= v_qty;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_pid;
            END IF;
        END IF;

        v_subtotal := v_subtotal + v_price * v_qty;
        v_snapshot := v_snapshot || jsonb_build_object(
            'id', v_pid, 'variantId', v_vid, 'name', v_name, 'price', v_price,
            'quantity', v_qty, 'size', v_size, 'color', v_color, 'sku', v_sku
        );
    END LOOP;

    IF v_discount > 0 AND p_min_cart_total IS NOT NULL AND v_subtotal < p_min_cart_total THEN
        v_discount := 0;
    END IF;

    v_total := GREATEST(0, ROUND(v_subtotal * (1 - v_discount) + v_shipping, 2));

    v_coupon := NULL;
    IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
        v_coupon := upper(trim(p_coupon_code));
    END IF;

    IF v_discount > 0 AND p_single_use IS TRUE AND v_coupon IS NOT NULL THEN
        INSERT INTO coupon_redemptions (coupon_code, user_id)
        VALUES (v_coupon, v_user);
    END IF;

    INSERT INTO orders (user_id, status, total_amount, payment_method, shipping_address, items, coupon_code)
    VALUES (
        v_user,
        'pending',
        v_total,
        COALESCE(p_payment_method, 'unknown'),
        p_shipping,
        v_snapshot,
        v_coupon
    )
    RETURNING id INTO v_order_id;

    RETURN jsonb_build_object(
        'orderId', v_order_id,
        'subtotal', v_subtotal,
        'shipping', v_shipping,
        'total', v_total
    );
END;
$$;

-- cancel: usa cupom do pedido quando parâmetro for NULL
CREATE OR REPLACE FUNCTION cancel_pending_order(
    p_order_id    UUID,
    p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_user     TEXT;
    v_items    JSONB;
    v_item     JSONB;
    v_vid      UUID;
    v_qty      INT;
    v_restored INT := 0;
    v_coupon   INT := 0;
    v_code     TEXT;
BEGIN
    SELECT user_id, items, coupon_code
      INTO v_user, v_items, v_code
      FROM orders
     WHERE id = p_order_id AND status = 'pending'
       FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('applied', false, 'reason', 'not_pending');
    END IF;

    -- Preferência: parâmetro explícito; senão o gravado no pedido.
    IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
        v_code := upper(trim(p_coupon_code));
    ELSIF v_code IS NOT NULL AND length(trim(v_code)) > 0 THEN
        v_code := upper(trim(v_code));
    ELSE
        v_code := NULL;
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_items, '[]'::jsonb))
    LOOP
        v_qty := COALESCE((v_item->>'quantity')::INT, 0);
        CONTINUE WHEN v_qty <= 0;

        v_vid := NULLIF(v_item->>'variantId', '')::UUID;

        IF v_vid IS NOT NULL THEN
            UPDATE product_variants SET stock = stock + v_qty WHERE id = v_vid;
        ELSE
            UPDATE products SET stock = stock + v_qty
             WHERE id = NULLIF(v_item->>'id', '')::UUID;
        END IF;

        IF FOUND THEN
            v_restored := v_restored + 1;
        END IF;
    END LOOP;

    IF v_code IS NOT NULL AND v_user IS NOT NULL THEN
        DELETE FROM coupon_redemptions
         WHERE coupon_code = v_code AND user_id = v_user;
        GET DIAGNOSTICS v_coupon = ROW_COUNT;
    END IF;

    UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'applied', true,
        'itemsRestored', v_restored,
        'couponReleased', v_coupon > 0
    );
END;
$$;
