# Handoff — Migração Supabase → Neon (LyVest)

> Objetivo: centralizar o banco no Neon (via Vercel Marketplace), removendo o Supabase.
> Motivo: o projeto Supabase Free pausava por inatividade e não tinha backup. O app já
> usava Clerk para auth (não Supabase Auth), Storage/Realtime não eram usados.

## ✅ FEITO (código — 100%)

- **Schema portado** para Postgres puro (sem RLS/PostgREST/clerk_uid JWT):
  `db/neon/0001_init.sql` (9 tabelas, 7 índices, funções `create_order`,
  `decrement_stock`, `increment_stock`) + `db/neon/0002_seed.sql` (5 categorias,
  8 produtos, frete grátis 199,90).
  - Mudança de design: `create_order` agora recebe `p_user_id` COMO PARÂMETRO,
    preenchido pelo servidor a partir do Clerk `auth()` — o cliente nunca escolhe o
    user_id. Zero-Trust preservado (preço relido do banco, estoque atômico, cupom UNIQUE).
  - Fix incluído: a RPC antiga ignorava `promotional_price` no checkout; a nova usa o
    preço efetivo (`COALESCE(promotional_price, price)`).
- **Camada de dados** migrada de `supabase-js` para **Drizzle + `@neondatabase/serverless`**:
  - `src/db/schema.ts` (schema Drizzle), `src/server/dbClient.ts` (cliente Neon server-side),
    `src/server/orderDb.ts` (chamadas às funções SQL).
  - **Browser nunca mais fala com o banco.** Toda query passa por API routes que validam
    o usuário via Clerk no servidor: novas rotas `/api/favorites`, `/api/addresses`,
    `/api/my-orders`; reescritas `/api/orders`, `/api/payment/create-session`,
    `/api/payment/webhook`, `/api/reviews`.
  - Componentes migrados: `useFavoritesStore`, `AddressSection`, `DashboardPageClient`,
    `ReviewModal`, `CheckoutWizard`, página de produto (server component → Drizzle direto),
    3 páginas admin (agregações no banco).
  - **Deletados**: `lib/supabase.ts`, `server/supabase.ts`, `supabaseAdmin.ts`,
    `supabaseServer.ts`, `types/supabase.ts`, `FavoritesContext.tsx` (código morto),
    e a dependência `@supabase/supabase-js`.
- **Provisionado na Vercel**: banco Neon **`lyvest-db`** (Free, região Washington/us-east),
  conectado ao projeto `lyvest` (Production + Preview). A integração injeta `DATABASE_URL`
  automaticamente nas env vars do projeto.
- `package.json`: adicionados `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`
  e o script `db:apply`.

## ✅ VALIDAÇÃO (feita no seu PC via .bat — 16/07 14:13)
- `npm install` limpo (658 pacotes; `node_modules` reinstalado do zero para corrigir
  corrupção causada pelo OneDrive).
- **`tsc --noEmit`: PASSOU com zero erros** — a migração Supabase→Drizzle é 100%
  type-correct.
- **`next build`: SUCESSO** — compilou e gerou todas as rotas, incluindo `/api/favorites`,
  `/api/addresses`, `/api/my-orders`, `/api/orders`, `/api/payment/*`, `/api/reviews`,
  `/admin/*`, `/produto/[slug]`.
- **Bug pré-existente corrigido:** `react-hot-toast` era importado em `ProductActions.tsx`
  mas nunca esteve no `package.json` (só existia solto no node_modules). Declarado como
  dependência (`^2.5.2`).
- Os avisos `[SECURITY] Rate limiting DESATIVADO` no build são esperados localmente
  (Upstash Redis não está no `.env.local`) — em produção as env vars existem.

## ✅ SCHEMA APLICADO NO NEON (feito — 16/07 14:28)
Aplicado via console do Neon (SSO da Vercel → "Open in Neon" → SQL Editor), no banco
`neondb`. Verificação: **5 categorias, 8 produtos, 1 financial_config**; funções
`create_order`, `decrement_stock`, `increment_stock` presentes. Todas as 9 tabelas +
7 índices criados (idempotente — as 4 tabelas criadas antes foram puladas com "already
exists").

## ⏳ FALTA — PARA IR AO AR (deploy)
O código migrado está no working tree local mas **ainda não foi deployado**. A produção
atual roda o código antigo (Supabase). Para publicar:
1. Commit + push do branch para o GitHub (via Git GUI — o sandbox não alcança o GitHub).
   Isso dispara o deploy automático na Vercel.
2. (Opcional, limpeza) Remover na Vercel as env vars antigas: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`. O `DATABASE_URL` já existe
   (injetado pela integração Neon em Production + Preview).

### (referência) Aplicar o schema no Neon (SEM editor web / SEM passkey)
A passkey só trava o editor SQL web da Vercel. Conexão direta não precisa dela.
```
npx vercel env pull .env.local     # baixa DATABASE_URL de produção
npm run db:apply                   # cria tabelas/funções + seed (idempotente)
```
O script (`scripts/apply-neon.mjs`) divide o SQL respeitando os blocos `$fn$` das funções
e roda instrução por instrução via `@neondatabase/serverless`. Ao final imprime a contagem
de categorias/produtos.

### 3. Limpar env vars antigas do Supabase (Vercel → Settings → Environment Variables)
Remover: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`.
(O `DATABASE_URL` a integração Neon já criou.)

### 4. Validar localmente
```
npm run check      # tsc --noEmit
npm run lint
npm run test:unit
npm run build
```

## 🔎 STATUS DA APLICAÇÃO DO SCHEMA (parcial, via editor web antes da troca de método)
Já criadas com sucesso no `lyvest-db`: `categories`, `profiles`, `products`, `orders`.
Como `0001_init.sql` é **idempotente** (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE
FUNCTION`), rodar `npm run db:apply` completa o restante sem conflito com o que já existe.

## 🔒 PENDÊNCIA DE SEGURANÇA (herdada)
Revogar o PAT antigo do GitHub em github.com/settings/tokens (já removido do remote local).
