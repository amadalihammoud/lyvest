-- Migração 0004: campos que a vitrine (mock) tinha e o catálogo real ainda não tem.
-- Objetivo: eliminar a dependência de src/data/products.ts (mock) na vitrine,
-- sem perder cor, galeria de imagens, especificações, EAN e selo promocional.
-- Idempotente (IF NOT EXISTS em tudo).

ALTER TABLE products ADD COLUMN IF NOT EXISTS ean TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.colors IS 'Array de {name, hex}. Preenchido manualmente ou via admin — o Bling v3 não expõe cor de forma estruturada.';
COMMENT ON COLUMN products.images IS 'Galeria adicional (a imagem principal continua em image_url).';
COMMENT ON COLUMN products.specs IS 'Pares chave/valor livres (Material, Modelagem, etc.) exibidos na ficha técnica.';
