# 🔐 Handoff — Segurança & Estrutura do LyVest (sessão 2)

> Atualizado em 10/07/2026. Substitui a versão anterior deste arquivo.
> Branch: `claude/lyvest-security-analysis-teptum`.

## ✅ O QUE FOI FEITO NESTA SESSÃO

### Infra/Painel (tudo aplicado e verificado)
- **Projeto Supabase antigo (`shgdgelnddjnemfgzzfv`) estava pausado e irrecuperável**
  ("No backups found"). Criado projeto novo: **`lyvest-prod`** (ref
  `pqvxfahxwcftinwephti`, sa-east-1, org Ly Vest).
- Schema completo aplicado no projeto novo: `SUPABASE_SETUP.sql` + migrations
  **002, 003, 005, 006, 007, 008, 009** (001 pulada de propósito: só criava
  `order_items`/`order_history`, mortas no código, e policies legadas).
- Catálogo semeado (`supabase/seed.sql`): 8 produtos, 5 categorias,
  `financial_configs` (frete grátis 199,90 / pix 5%).
- **Clerk ↔ Supabase LIGADO**: integração ativada no Clerk (domínio
  `https://clerk.lyvest.com.br`) e provider Clerk registrado em
  Authentication → Sign In/Providers → Third-Party Auth. RLS funcional.
- `.env.local` local atualizado para o projeto novo (URL + publishable key).

### Código (commits desta sessão, nesta ordem)
1. `a2c9384` refactor(server): `server/services` → `server/providers` (fim da colisão de nomes)
2. `d664a71` refactor(ts): migra providers/data/chat p/ TS (+3 bugs latentes corrigidos:
   select com colunas inexistentes em products, `companyInfo.email` undefined no prompt,
   script `check` ausente no package.json que a CI chama)
3. `f3c3ee2` feat(shipping): frete grátis lido do banco (`financial_configs`) + fix do
   modal com R$350 hardcoded; novo `GET /api/config/shipping`; store dinâmico
4. `15d0e44` fix(supabase): migrations 005/006 reordenadas (bug 0A000: ALTER de coluna
   antes de derrubar policies dependentes — quebrava em banco novo) + seed no repo

## 🛠️ DEPENDE DE VOCÊ (rápido)
1. **Vercel — atualizar env de produção** (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://pqvxfahxwcftinwephti.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = publishable key (Settings → API Keys do lyvest-prod)
   - `SUPABASE_SECRET_KEY` = secret key (NUNCA no cliente; será usada pelo webhook)
   - Conferir: `PAYMENT_WEBHOOK_SECRET`, Upstash Redis, `OPENAI_API_KEY`, chaves Clerk
2. **Token GitHub antigo**: já removido do remote (era inválido p/ push e ficava em texto
   puro). Auth agora via GCM (device flow). **Revogar o token antigo** em
   github.com/settings/tokens se ainda existir.
3. **Teste de isolamento RLS** (2 usuários; A não vê endereço de B) — roteiro na migration 006.

## 📋 O QUE FALTA (código) — ordem sugerida
1. **Webhook marcar pedido como pago** (análise pronta, não implementado):
   - Criar `src/lib/server/supabaseAdmin.ts` (client com `SUPABASE_SECRET_KEY`, server-only).
   - `create-session/route.ts`: se logado, chamar RPC `create_order` ANTES da sessão
     (status `pending`) e mandar `orderId` em `metadata.orderId`; devolver `orderId`.
     Extrair `couponRuleFor` de `orders/route.ts` p/ `src/config/coupons.ts` e reusar.
     Adicionar `paymentMethod`/`shipping` ao schema da create-session (espelhar wizard).
   - `webhook/route.ts` (`handleEvent`): em `payment_intent.succeeded`/`order.paid`,
     update idempotente `pending` → **`processing`** via admin client
     (⚠️ o CHECK de `orders.status` NÃO tem 'paid'; usar 'processing' = pago).
   - `CheckoutWizard.tsx` (`handlePaymentSubmit`): parar de chamar `/api/orders`
     (senão duplica pedido); usar `orderId` devolvido pela create-session.
     No mock não há webhook → pedido fica `pending` (paridade com hoje).
2. **PCI/tokenização**: exige escolher gateway real (Mercado Pago/Stripe) — decisão de
   negócio; hoje o provider é mock. Enquanto isso, remover coleta de número/CVV do
   checkout React.
3. **Migrar chat p/ AI SDK v6** (cliente+servidor juntos): o protocolo atual é o antigo
   com casts tipados (documentado em `route.ts` e `ChatWidget.tsx`) e possivelmente
   quebrado em runtime com `ai` v6 — testar `/api/chat` e priorizar se estiver 500.
4. CI só roda em push para main/develop e em PR → **abrir PR do branch para main**
   para a CI validar (lint/check/test/build).

## 🧭 PARA COLAR NUMA NOVA SESSÃO
> Estou retomando o LyVest, branch `claude/lyvest-security-analysis-teptum`. Leia
> `HANDOFF_SEGURANCA.md` (raiz) e continue em "O QUE FALTA", item 1 (webhook). O working
> tree local do Windows está em main desatualizado — trabalhe num clone
> (`git clone file://<pasta>/.git`) após `git fetch` via Git GUI, e faça push pelo Git GUI
> (GCM device flow). Supabase do projeto é `lyvest-prod` (pqvxfahxwcftinwephti); painel OK.
