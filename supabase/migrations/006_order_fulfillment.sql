-- Migration 006: Fulfillment de pedido (liga os Pilares 2/3 no runtime)
-- Execute no SQL Editor do Supabase DEPOIS da 005. Idempotente onde possível.
--
-- Fecha os achados F1/F2 da security-review:
--   F1 — decremento atômico de estoque acionado de fato no pagamento aprovado.
--   F2 — cupom de uso único gravado atomicamente (coupon_redemptions + UNIQUE).
--
-- Conteúdo:
--   1. Reconcilia a RLS de orders/order_items/order_history para o modelo Clerk
--      (public.clerk_uid() TEXT), alinhando com as migrações 005 (addresses) e Clerk.
--   2. Torna decrement_stock SECURITY DEFINER (executável a partir do backend server-side,
--      via service-role, sem depender da RLS de products).
--   3. RPC atômica e idempotente mark_order_paid(): decrementa estoque de cada item,
--      registra resgate de cupom (uso único) e marca o pedido como 'paid' — tudo numa
--      única transação, com guarda de status para efeito-único (idempotência).

-- Pré-requisito: public.clerk_uid() (criada em 005 / SUPABASE_CLERK_MIGRATION.sql).

-- =====================================================================
-- 1. Reconciliar RLS de orders/order_items/order_history para Clerk (Pilar 3)
-- =====================================================================
-- A migração 001 criou estas tabelas com user_id UUID + policies auth.uid().
-- O app usa Clerk (sub TEXT). Migramos a coluna e recriamos as policies.

-- Remover policies antigas (auth.uid()).
DROP POLICY IF EXISTS "Users can view their own orders"            ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders"          ON public.orders;
DROP POLICY IF EXISTS "Users can view items of their own orders"   ON public.order_items;
DROP POLICY IF EXISTS "Users can view history of their own orders" ON public.order_history;

-- Migrar tipo de orders.user_id para TEXT (Clerk sub) e remover FK para auth.users.
-- Permitir NULL: checkout de convidado é suportado (o estoque deve decrementar mesmo
-- sem usuário logado). A escrita de pedido é feita pelo backend service-role.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Recriar policies escopadas por clerk_uid().
DROP POLICY IF EXISTS "User View Own Orders"   ON public.orders;
DROP POLICY IF EXISTS "User Insert Own Orders" ON public.orders;
CREATE POLICY "User View Own Orders" ON public.orders
  FOR SELECT USING (public.clerk_uid() = user_id);
CREATE POLICY "User Insert Own Orders" ON public.orders
  FOR INSERT WITH CHECK (public.clerk_uid() = user_id);

DROP POLICY IF EXISTS "User View Own Order Items" ON public.order_items;
CREATE POLICY "User View Own Order Items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = public.clerk_uid()
    )
  );

DROP POLICY IF EXISTS "User View Own Order History" ON public.order_history;
CREATE POLICY "User View Own Order History" ON public.order_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_history.order_id
        AND o.user_id = public.clerk_uid()
    )
  );

-- =====================================================================
-- 2. decrement_stock como SECURITY DEFINER (Pilar 2)
-- =====================================================================
-- Executa com os privilégios do owner (ignora a RLS de products) — necessário para
-- o backend server-side/service-role decrementar estoque. A condição atômica
-- (WHERE stock >= p_qty) continua sendo a garantia anti-race.
CREATE OR REPLACE FUNCTION public.decrement_stock(p_id BIGINT, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.products
     SET stock = stock - p_qty
   WHERE id = p_id
     AND stock >= p_qty;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================================
-- 3. mark_order_paid — fulfillment atômico e idempotente (Pilares 1/2)
-- =====================================================================
-- Numa única transação:
--   - trava o pedido (FOR UPDATE);
--   - se já estiver 'paid', não faz nada (idempotência de webhook repetido);
--   - decrementa estoque de cada item (best-effort atômico; itens sem estoque
--     suficiente são reportados em out_insufficient para conciliação manual —
--     o pagamento já foi capturado, então não abortamos o fulfillment);
--   - registra o resgate de cupom de uso único (ON CONFLICT DO NOTHING => a UNIQUE
--     garante 1 uso por usuário; segunda tentativa não duplica);
--   - marca o pedido como 'paid' e grava histórico.
-- Retorna o status final: 'paid' | 'already_paid' | 'not_found'.
CREATE OR REPLACE FUNCTION public.mark_order_paid(p_order_number TEXT)
RETURNS TEXT AS $$
DECLARE
  v_order       public.orders%ROWTYPE;
  v_item        RECORD;
  v_ok          BOOLEAN;
  v_insufficient TEXT[] := '{}';
BEGIN
  SELECT * INTO v_order
    FROM public.orders
   WHERE order_number = p_order_number
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN 'already_paid';
  END IF;

  -- Decremento atômico por item.
  FOR v_item IN
    SELECT product_id, quantity FROM public.order_items WHERE order_id = v_order.id
  LOOP
    v_ok := public.decrement_stock(v_item.product_id::bigint, v_item.quantity::int);
    IF NOT v_ok THEN
      v_insufficient := array_append(v_insufficient, v_item.product_id::text);
    END IF;
  END LOOP;

  -- Resgate de cupom de uso único (se houver cupom e usuário no pedido).
  IF v_order.discount IS NOT NULL AND v_order.discount > 0
     AND v_order.user_id IS NOT NULL
     AND (v_order.payment_method ->> 'coupon') IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions (coupon_code, user_id, order_id)
    VALUES (v_order.payment_method ->> 'coupon', v_order.user_id, v_order.id::text)
    ON CONFLICT (coupon_code, user_id) DO NOTHING;
  END IF;

  UPDATE public.orders SET status = 'paid' WHERE id = v_order.id AND status = 'pending';

  INSERT INTO public.order_history (order_id, status, label)
  VALUES (
    v_order.id,
    'paid',
    CASE WHEN array_length(v_insufficient, 1) IS NULL
         THEN 'Pagamento confirmado'
         ELSE 'Pagamento confirmado (estoque insuficiente: ' || array_to_string(v_insufficient, ',') || ')'
    END
  );

  RETURN 'paid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
