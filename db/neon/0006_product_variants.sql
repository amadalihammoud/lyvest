-- Migração 0006: variantes de produto (grade de tamanho/cor com estoque próprio).
--
-- PROBLEMA QUE RESOLVE
-- Até aqui, `products.stock` era um contador único por produto e `products.sizes`
-- apenas um array de rótulos. Numa loja de vestuário isso é overselling estrutural:
-- um produto com 10 peças, todas GG, aceitava alegremente 10 pedidos de tamanho P.
-- O `size` escolhido pelo cliente ia carimbado no snapshot JSONB do pedido sem
-- nunca ser validado contra `products.sizes` nem contra saldo algum.
--
-- POR QUE AGORA
-- O catálogo está vazio (0 produtos no Neon, 0 produtos ativos no Bling). Fazer
-- esta mudança depois de cadastrar catálogo e acumular pedidos exigiria migração
-- de dados, backfill de variantes e conciliação de histórico. Agora é só DDL.
--
-- SEGURANÇA DESTA MIGRAÇÃO
-- Ela é INERTE até existir variante. `create_order` decide o caminho por produto:
-- se o produto não tem nenhuma variante ativa, o comportamento é exatamente o
-- anterior (baixa em products.stock). Nada quebra ao aplicar.
--
-- Idempotente (IF NOT EXISTS / CREATE OR REPLACE em tudo).

-- ============ TABELA ============

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT,                                  -- NULL = produto sem grade de tamanho
    color TEXT,                                 -- NULL = produto sem variação de cor
    sku TEXT,
    ean TEXT,
    bling_id BIGINT,                            -- id da variação no Bling
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    price DECIMAL(10,2) CHECK (price IS NULL OR price >= 0),                          -- NULL = herda de products.price
    promotional_price DECIMAL(10,2) CHECK (promotional_price IS NULL OR promotional_price >= 0),
    active BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE  product_variants IS 'Grade vendável. Quando um produto tem variantes ativas, o estoque autoritativo é o da variante — products.stock passa a ser um espelho derivado (ver trigger abaixo).';
COMMENT ON COLUMN product_variants.price IS 'Sobrescreve products.price quando não-nulo. Use para grades com preço diferente por tamanho.';
COMMENT ON COLUMN product_variants.stock IS 'CHECK (stock >= 0) é a última linha de defesa: a baixa condicional em create_order já impede negativo, mas a constraint protege contra qualquer escrita direta.';

-- ============ ÍNDICES ============

-- Unicidade da combinação. COALESCE em vez de UNIQUE NULLS NOT DISTINCT para não
-- depender de PG15+: em Postgres, NULLs não colidem numa UNIQUE comum, então duas
-- linhas (produto, NULL, NULL) passariam despercebidas sem este tratamento.
-- Os parênteses em volta de cada COALESCE são obrigatórios: Postgres só dispensa
-- parênteses em índice de expressão quando a expressão é uma chamada de função
-- simples, e COALESCE é construção SQL, não função comum.
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_combo
    ON product_variants (product_id, (COALESCE(size, '')), (COALESCE(color, '')));

-- Mesmo padrão parcial já usado em products.bling_id (migração 0003): permite
-- conviver com variantes criadas à mão (sem bling_id) sem abrir brecha p/ duplicata.
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_bling_id
    ON product_variants (bling_id) WHERE bling_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_sku
    ON product_variants (sku) WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

-- ============ ESPELHO DE ESTOQUE ============
-- A vitrine e o admin leem products.stock para saber se há disponibilidade. Em vez
-- de mudar todos esses pontos de leitura agora, mantemos products.stock como soma
-- derivada das variantes ativas. Quem manda continua sendo a variante; isto é só
-- um cache para não obrigar JOIN em toda listagem.
CREATE OR REPLACE FUNCTION sync_product_stock_from_variants()
RETURNS TRIGGER AS $$
DECLARE
  v_product UUID;
BEGIN
  -- Em trigger de DELETE o registro NEW não é atribuído; referenciar NEW.campo
  -- levanta "record new is not assigned yet". Por isso o desvio por TG_OP em vez
  -- de um COALESCE(NEW.product_id, OLD.product_id).
  IF TG_OP = 'DELETE' THEN
    v_product := OLD.product_id;
  ELSE
    v_product := NEW.product_id;
  END IF;

  UPDATE products p
     SET stock = COALESCE((
           SELECT SUM(v.stock)::INT
             FROM product_variants v
            WHERE v.product_id = v_product AND v.active
         ), 0)
   WHERE p.id = v_product;
  RETURN NULL; -- AFTER trigger: valor de retorno é ignorado
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_stock ON product_variants;
CREATE TRIGGER trg_sync_product_stock
    AFTER INSERT OR UPDATE OF stock, active OR DELETE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION sync_product_stock_from_variants();

-- ============ FUNÇÕES DE ESTOQUE POR VARIANTE ============
-- Espelham decrement_stock/increment_stock (0001), com a mesma garantia: a
-- condição vive DENTRO do UPDATE, então duas compras simultâneas da última peça
-- nunca deixam saldo negativo.

CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;
  UPDATE product_variants SET stock = stock - p_qty
   WHERE id = p_variant_id AND stock >= p_qty;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_variant_stock(p_variant_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;
  UPDATE product_variants SET stock = stock + p_qty WHERE id = p_variant_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

-- ============ create_order CIENTE DE VARIANTE ============
--
-- Assinatura INALTERADA — o app não precisa mudar para aplicar esta migração.
-- O que muda é o formato aceito dentro de p_items, que ganha um campo opcional:
--   [{"id":"<produto uuid>","quantity":<int>,"variantId":"<variante uuid>"}]
--
-- Regra por item:
--   - produto SEM variante ativa  -> caminho antigo, baixa em products.stock
--   - produto COM variante ativa  -> variantId é OBRIGATÓRIO, baixa na variante
--
-- Isso permite conviver produto simples (um cachecol, sem grade) e produto com
-- grade (um sutiã P/M/G/GG) no mesmo catálogo, sem inventar variante fantasma.
--
-- Zero-Trust preservado e reforçado: tamanho e cor agora vêm da LINHA da variante,
-- não mais do payload do cliente. Antes, `size` era copiado cru do JSON recebido.

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

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_pid := (v_item->>'id')::uuid;
        v_qty := (v_item->>'quantity')::int;
        v_vid := NULLIF(v_item->>'variantId', '')::uuid;

        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'INVALID_QTY';
        END IF;

        -- Produto (fonte da verdade do preço-base e do nome).
        --
        -- CUIDADO COM O ZERO: `COALESCE(promotional_price, price)` — como estava
        -- antes — só desvia quando a promoção é NULL. Uma promoção gravada como
        -- 0.00, plausível vindo de ERP, era adotada e o item saía a R$0. Como o
        -- total desta função SOBRESCREVE o cálculo da aplicação, aqui é onde o
        -- erro efetivamente cobraria zero do cliente.
        -- Promoção só vale quando é maior que zero.
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

            -- Preço da variante tem precedência; cai no do produto quando nulo.
            -- O WHERE amarra a variante ao produto: impede montar um item com a
            -- variante barata de um produto e o id de outro.
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
