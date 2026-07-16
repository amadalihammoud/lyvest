-- Migration 013: Atualização da RPC create_order para suportar checkout de convidados (guests)
-- --------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order(
    p_items          JSONB,   -- [{"id":"<uuid>","quantity":<int>}]
    p_coupon_code    TEXT,    -- código do cupom (ou NULL)
    p_discount       NUMERIC, -- fração 0..1 já validada no servidor
    p_single_use     BOOLEAN, -- true = registrar resgate (uso único)
    p_min_cart_total NUMERIC, -- mínimo exigido pelo cupom
    p_payment_method TEXT,
    p_shipping       JSONB,
    p_guest_email    TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user     TEXT := public.clerk_uid();
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
    -- Se o usuário não estiver logado, mas fornecer um e-mail de convidado, criamos como convidado.
    IF v_user IS NULL THEN
        IF p_guest_email IS NOT NULL AND p_guest_email <> '' THEN
            v_user := 'guest:' || lower(trim(p_guest_email));
        ELSE
            RAISE EXCEPTION 'AUTH_REQUIRED';
        END IF;
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART';
    END IF;

    -- Percorre os itens: relê preço, valida e baixa estoque atomicamente.
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_pid := (v_item->>'id')::uuid;
        v_qty := (v_item->>'quantity')::int;

        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'INVALID_QTY';
        END IF;

        SELECT price, name INTO v_price, v_name
          FROM public.products
         WHERE id = v_pid AND active = true;

        IF v_price IS NULL THEN
            RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', v_pid;
        END IF;

        -- Baixa atômica condicional — nunca read-then-write.
        UPDATE public.products
           SET stock = stock - v_qty
         WHERE id = v_pid AND stock >= v_qty;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_pid;
        END IF;

        v_subtotal := v_subtotal + v_price * v_qty;
        v_snapshot := v_snapshot || jsonb_build_object(
            'id', v_pid, 'name', v_name, 'price', v_price, 'quantity', v_qty
        );
    END LOOP;

    -- Revalida o desconto contra o subtotal REAL do banco.
    IF v_discount > 0 AND p_min_cart_total IS NOT NULL AND v_subtotal < p_min_cart_total THEN
        v_discount := 0;
    END IF;

    v_total := GREATEST(0, ROUND(v_subtotal * (1 - v_discount), 2));

    -- Cupom de uso único: registra o resgate.
    IF v_discount > 0 AND p_single_use IS TRUE
       AND p_coupon_code IS NOT NULL AND length(p_coupon_code) > 0 THEN
        INSERT INTO public.coupon_redemptions (coupon_code, user_id)
        VALUES (upper(p_coupon_code), v_user);
    END IF;

    INSERT INTO public.orders (user_id, status, total_amount, payment_method, shipping_address, items)
    VALUES (v_user, 'pending', v_total, COALESCE(p_payment_method, 'unknown'), p_shipping, v_snapshot)
    RETURNING id INTO v_order_id;

    RETURN jsonb_build_object('orderId', v_order_id, 'subtotal', v_subtotal, 'total', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order(JSONB, TEXT, NUMERIC, BOOLEAN, NUMERIC, TEXT, JSONB, TEXT)
    TO anon, authenticated, service_role;
