-- 0008 — create_order inclui frete no total.
--
-- PROBLEMA
-- Até 0006/0007, v_total era só subtotal * (1 - desconto). O frete ia em
-- shipping_address (JSONB) e NÃO entrava no total_amount nem no amount enviado
-- ao Asaas. Resultado: a loja cobrava só os produtos e absorvia o frete.
--
-- SOLUÇÃO
-- Lê p_shipping->>'price' (numérico >= 0), soma ao total após o desconto.
-- O app DEVE recalcular esse price no servidor antes de chamar create_order
-- (Zero-Trust); a SQL é a última linha de defesa contra valor negativo.
--
-- Idempotente: CREATE OR REPLACE da mesma assinatura.

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

    -- Frete: só aceita número >= 0. Negativo ou não-numérico = 0 (fail-safe).
    -- Teto 500 evita payload absurdo se o app falhar ao recalcular.
    BEGIN
        v_shipping := COALESCE((p_shipping->>'price')::numeric, 0);
    EXCEPTION WHEN others THEN
        v_shipping := 0;
    END;
    IF v_shipping < 0 THEN
        RAISE EXCEPTION 'INVALID_SHIPPING';
    END IF;
    IF v_shipping > 500 THEN
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

    -- Produtos com desconto + frete autoritativo.
    v_total := GREATEST(0, ROUND(v_subtotal * (1 - v_discount) + v_shipping, 2));

    IF v_discount > 0 AND p_single_use IS TRUE
       AND p_coupon_code IS NOT NULL AND length(p_coupon_code) > 0 THEN
        INSERT INTO coupon_redemptions (coupon_code, user_id)
        VALUES (upper(p_coupon_code), v_user);
    END IF;

    INSERT INTO orders (user_id, status, total_amount, payment_method, shipping_address, items)
    VALUES (v_user, 'pending', v_total, COALESCE(p_payment_method, 'unknown'), p_shipping, v_snapshot)
    RETURNING id INTO v_order_id;

    RETURN jsonb_build_object(
        'orderId', v_order_id,
        'subtotal', v_subtotal,
        'shipping', v_shipping,
        'total', v_total
    );
END;
$$;
