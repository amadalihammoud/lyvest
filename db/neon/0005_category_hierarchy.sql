-- Migração 0005: hierarquia de categorias (pai/filho), espelhando a árvore do Bling.
-- Objetivo: o menu principal mostrar só categorias de topo (Feminino, Masculino,
-- Menina, Menino, Outlet...) e as demais (Sutiã, Cueca, Meia, Pijama...) virarem
-- subcategorias exibidas num mega-menu / dentro da página da categoria pai.
-- Idempotente.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

COMMENT ON COLUMN categories.parent_id IS 'Categoria pai (Bling: categoriaPai.id). NULL = categoria de topo (aparece no menu principal).';
