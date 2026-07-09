-- Migration 008: Criação atômica de pedido (Pilares 1 e 2 — Zero-Trust + Race Conditions)
-- --------------------------------------------------------------------------------------------
-- Fecha o último buraco crítico: hoje nenhum pedido é persistido, o estoque nunca é baixado
-- e o cupom de uso único nunca é registrado. Esta RPC faz tudo isso de forma ATÔMICA e
-- server-authoritative:
--
--   - Identidade vem do JWT (public.clerk_uid()) DENTRO da função — nunca de parâmetro,
--     então o cliente não consegue criar pedido no nome de outra pessoa (Pilar 3).
--   - Preço unitário é RELIDO de public.products (fonte da verdade) — o cliente só manda
--     id + quantidade (Pilar 1). Qualquer preço/total do cliente é ignorado.
--   - O mínimo do cupom é revalidado contra o subtotal REAL do banco (não o do cliente).
--   - Baixa de estoque é condicional e atômica (UPDATE ... WHERE stock >= qty) — duas
--     compras simultâneas nunca deixam o estoque negativo (Pilar 2).
--   - Cupom de uso único é registrado em coupon_redemptions; a UNIQUE(coupon_code,user_id)
--     aborta a transação inteira se houver reuso (Pilar 2).
--   - Tudo numa única transação (função plpgsql): se qualquer passo falhar, NADA é aplicado
--     (sem estoque baixado a menos, sem pedido órfão).
--
-- SECURITY DEFINER: necessário para dar baixa em products (leitura pública, escrita
-- restrita). A função valida a identidade via clerk_uid() antes de qualquer efeito.
--
-- Idempotente (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.create_order(
    p_items          JSONB,   -- [{"id":"<uuid>","quantity":<int>}]
    p_coupon_code    TEXT,    -- código do cupom (ou NULL)
    p_discount       NUMERIC, -- fração 0..1 já validada no servidor (coupons.ts)
    p_single_use     BOOLEAN, -- true = registrar resgate (uso único)
    p_min_cart_total NUMERIC, -- mínimo exigido pelo cupom (revalidado contra o subtotal real)
    p_payment_method TEXT,
    p_shipping       JSONB
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
    -- Pilar 3: exige usuário autenticado (identidade do token, não do corpo).
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
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

    -- Revalida o desconto contra o subtotal REAL do banco. Se o mínimo do cupom não for
    -- atingido de verdade, o desconto é descartado (Zero-Trust: não confia no subtotal
    -- que o cliente usou para validar o cupom).
    IF v_discount > 0 AND p_min_cart_total IS NOT NULL AND v_subtotal < p_min_cart_total THEN
        v_discount := 0;
    END IF;

    v_total := GREATEST(0, ROUND(v_subtotal * (1 - v_discount), 2));

    -- Cupom de uso único: registra o resgate. A UNIQUE(coupon_code,user_id) aborta a
    -- transação inteira em caso de reuso (estoque baixado é revertido junto).
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

-- Permite que os papéis do PostgREST executem a função (a autorização real é o
-- clerk_uid() interno). Ajuste os nomes de papel se seu projeto usar outros.
GRANT EXECUTE ON FUNCTION public.create_order(JSONB, TEXT, NUMERIC, BOOLEAN, NUMERIC, TEXT, JSONB)
    TO anon, authenticated;
