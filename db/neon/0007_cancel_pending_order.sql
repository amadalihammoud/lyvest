-- 0007 — cancel_pending_order: desfaz um pedido 'pending' atomicamente.
--
-- POR QUE ISTO EXISTE
--
-- /api/payment/create-session usa fluxo INVERTIDO: cria o pedido via
-- create_order ANTES de pedir a sessão ao gateway. Isso é proposital — o
-- estoque precisa estar reservado antes de o cliente ver a tela de pagamento,
-- senão dois clientes compram a mesma última peça.
--
-- Mas se o gateway falhar DEPOIS disso (Asaas fora do ar, chave ausente, link
-- recusado), a transação de create_order já commitou: estoque baixado, cupom de
-- uso único consumido, pedido 'pending' criado. O cliente recebe um erro, não
-- tem link nenhum para pagar, e fica um pedido órfão segurando estoque real —
-- e, se o cupom era single-use, ele não consegue nem repetir a compra.
--
-- Desfazer isso do lado da aplicação seria três escritas sequenciais sem
-- transação (o driver neon-http não suporta), e uma falha no meio deixaria o
-- estado PIOR do que o problema original. Por isso a compensação vive aqui:
-- uma função plpgsql é uma transação, igual ao create_order que ela desfaz.
--
-- IDEMPOTENTE: só age sobre 'pending'. Chamar duas vezes não devolve estoque
-- duas vezes — a segunda chamada devolve applied=false. Isso importa porque o
-- chamador pode reexecutar em retry.

CREATE OR REPLACE FUNCTION cancel_pending_order(
    p_order_id    UUID,
    -- O pedido NÃO guarda o cupom usado (a tabela orders não tem essa coluna),
    -- então quem cancela precisa informá-lo. NULL = não havia cupom a liberar.
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
BEGIN
    -- FOR UPDATE serializa contra outra tentativa de cancelar o mesmo pedido.
    -- Sem o lock, duas chamadas concorrentes veriam ambas o status 'pending' e
    -- devolveriam o estoque em dobro.
    SELECT user_id, items
      INTO v_user, v_items
      FROM orders
     WHERE id = p_order_id AND status = 'pending'
       FOR UPDATE;

    IF NOT FOUND THEN
        -- Já cancelado, já pago, ou inexistente. Nada a fazer, e isso não é erro.
        RETURN jsonb_build_object('applied', false, 'reason', 'not_pending');
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_items, '[]'::jsonb))
    LOOP
        v_qty := COALESCE((v_item->>'quantity')::INT, 0);
        CONTINUE WHEN v_qty <= 0;

        v_vid := NULLIF(v_item->>'variantId', '')::UUID;

        IF v_vid IS NOT NULL THEN
            -- Só a variante. O trigger trg_sync_product_stock recalcula
            -- products.stock a partir das variantes; somar nos dois lugares
            -- devolveria o dobro do que foi baixado.
            UPDATE product_variants SET stock = stock + v_qty WHERE id = v_vid;
        ELSE
            UPDATE products SET stock = stock + v_qty
             WHERE id = NULLIF(v_item->>'id', '')::UUID;
        END IF;

        IF FOUND THEN
            v_restored := v_restored + 1;
        END IF;
    END LOOP;

    -- Libera o cupom de uso único. Sem isto o cliente fica impedido de refazer
    -- a compra que o gateway impediu — punido por uma falha que não foi dele.
    IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 AND v_user IS NOT NULL THEN
        DELETE FROM coupon_redemptions
         WHERE coupon_code = upper(trim(p_coupon_code)) AND user_id = v_user;
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
