-- Migração 0003 — Integração Bling (fase Catálogo Real). Idempotente.
-- Aplicar via npm run db:apply (o script roda todos os db/neon/*.sql em ordem)
-- ou colar no SQL Editor do Neon.

-- Correlação catálogo ↔ Bling
ALTER TABLE categories ADD COLUMN IF NOT EXISTS bling_id BIGINT;
ALTER TABLE products   ADD COLUMN IF NOT EXISTS bling_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_bling_id ON categories(bling_id) WHERE bling_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_bling_id   ON products(bling_id)   WHERE bling_id IS NOT NULL;

-- Tokens OAuth do Bling (access ~6h; refresh é ROTATIVO — cada refresh devolve
-- um novo refresh_token e invalida o anterior, por isso precisa viver no banco).
-- Linha única (id=1). Server-only; nunca exposto ao cliente.
CREATE TABLE IF NOT EXISTS bling_tokens (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
