-- Migration 012: Adiciona função para incremento atômico de estoque (Reembolso/Estorno)
-- --------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_stock(p_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  affected INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.products
     SET stock = stock + p_qty
   WHERE id = p_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.increment_stock(UUID, INT) TO anon, authenticated, service_role;
