-- Migration 006: Ficha técnica de medidas por produto (medidas_grade / size_charts)
-- Execute no SQL Editor do Supabase. Idempotente onde possível.
--
-- Contexto: a tabela canônica por categoria vive no código (src/data/sizeChart.ts) como
-- fallback. Esta tabela guarda a ficha técnica REAL de cada produto — vinda do
-- fornecedor/fabricante ou, futuramente, sincronizada do ERP — vinculada ao produto
-- e ao tamanho da grade (SKU). Valores são MEDIDAS DO CORPO (cm), não da peça.
--
-- Segurança (skill ecommerce-security):
--   Pilar 3/4 — leitura é Vitrine (SELECT público, bom para SEO); escrita é Cofre:
--   nenhuma policy de INSERT/UPDATE/DELETE para anon/authenticated → só service_role
--   (painel admin / integração ERP server-side).

CREATE TABLE IF NOT EXISTS public.size_charts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL CHECK (size IN ('PP', 'P', 'M', 'G', 'GG')),

    -- Medidas do corpo (cm). NULL = medida não se aplica à peça.
    bust_min      NUMERIC(5,1) CHECK (bust_min      IS NULL OR bust_min      BETWEEN 50 AND 200),
    bust_max      NUMERIC(5,1) CHECK (bust_max      IS NULL OR bust_max      BETWEEN 50 AND 200),
    underbust_min NUMERIC(5,1) CHECK (underbust_min IS NULL OR underbust_min BETWEEN 40 AND 180),
    underbust_max NUMERIC(5,1) CHECK (underbust_max IS NULL OR underbust_max BETWEEN 40 AND 180),
    waist_min     NUMERIC(5,1) CHECK (waist_min     IS NULL OR waist_min     BETWEEN 40 AND 200),
    waist_max     NUMERIC(5,1) CHECK (waist_max     IS NULL OR waist_max     BETWEEN 40 AND 200),
    hip_min       NUMERIC(5,1) CHECK (hip_min       IS NULL OR hip_min       BETWEEN 50 AND 220),
    hip_max       NUMERIC(5,1) CHECK (hip_max       IS NULL OR hip_max       BETWEEN 50 AND 220),

    -- Numeração BR do sutiã correspondente (ex.: '42-44'); NULL para outras categorias.
    bra_number TEXT,

    -- Origem do dado: manual (você mediu), fornecedor (ficha técnica), erp (sync).
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'fornecedor', 'erp')),

    -- Intervalos coerentes (min <= max quando ambos presentes)
    CONSTRAINT size_charts_bust_range      CHECK (bust_min      IS NULL OR bust_max      IS NULL OR bust_min      <= bust_max),
    CONSTRAINT size_charts_underbust_range CHECK (underbust_min IS NULL OR underbust_max IS NULL OR underbust_min <= underbust_max),
    CONSTRAINT size_charts_waist_range     CHECK (waist_min     IS NULL OR waist_max     IS NULL OR waist_min     <= waist_max),
    CONSTRAINT size_charts_hip_range       CHECK (hip_min       IS NULL OR hip_max       IS NULL OR hip_min      <= hip_max),

    -- Um registro por produto+tamanho (upsert natural para o sync do ERP)
    CONSTRAINT size_charts_product_size_unique UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_size_charts_product ON public.size_charts (product_id);

-- updated_at automático
CREATE OR REPLACE FUNCTION public.touch_size_charts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_size_charts_updated_at ON public.size_charts;
CREATE TRIGGER trg_size_charts_updated_at
    BEFORE UPDATE ON public.size_charts
    FOR EACH ROW EXECUTE FUNCTION public.touch_size_charts_updated_at();

-- RLS: leitura pública (Vitrine), escrita apenas service_role (Cofre)
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "size_charts_public_read" ON public.size_charts;
CREATE POLICY "size_charts_public_read" ON public.size_charts
    FOR SELECT USING (true);
-- (sem policies de escrita: INSERT/UPDATE/DELETE ficam negados para anon/authenticated)
