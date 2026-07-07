# Roadmap de Consolidação do Backend — LyVest

> **Status:** proposta / roadmap. É um documento de arquitetura, **não** um refactor já executado.
> Cada fase é independente e deve ser aprovada antes de iniciar.
> **Idioma:** pt-BR · **Última revisão:** 2026-07

## Por que este documento existe

O gargalo de escala e de segurança do LyVest **não é a linguagem** (TypeScript é a escolha certa e
deve ser mantida) — é a **arquitetura do backend**, hoje dividida em duas superfícies paralelas com
lógica duplicada. Este roadmap descreve como consolidar isso de forma **incremental (strangler
pattern)**, sem reescrita big-bang e sem trocar a stack, preservando a storefront Next.js
(SSR/SEO/GEO) e o modelo "Cofre vs. Vitrine".

## Princípios

1. **Uma fonte da verdade por domínio** (pagamento, pedido, estoque, cupom, frete).
2. **TypeScript ponta a ponta**; tipos compartilhados entre storefront e backend.
3. **Cofre vs. Vitrine**: rotas transacionais protegidas; catálogo/GET aberto para crawlers.
4. **Secure by Design**: todo endpoint transacional nasce com auth + ownership + Zod + rate limit
   (ver skill `ecommerce-security`).
5. **Incremental e reversível**: migrar rota a rota, cada passo com build verde.

## Non-goals

- ❌ Trocar de linguagem (não migrar para Go/.NET/Elixir agora).
- ❌ Trocar Postgres/Supabase.
- ❌ Reescrita total de uma vez.
- ❌ Adicionar rate limit ou auth em rotas públicas de catálogo (quebraria SEO/GEO).

---

## Estado atual (as-is)

Existem **duas superfícies de API desconexas**:

```
Storefront (Next.js 16, App Router, TS)
│
├─ src/app/api/**/route.ts        (TS, Clerk-aware)         ← superfície MODERNA
│    ├─ ai/size-recommendation
│    ├─ auth/me
│    └─ coupons/validate
│
└─ api/**/*.js                    (Vercel serverless, JS)   ← superfície LEGADA
     ├─ payment/create-session · payment/webhook
     ├─ shipping/calculate
     ├─ erp/sync-order · erp/webhook-stock
     ├─ chat/route · status
     ├─ _services/ (payment, shipping, erp, products)
     ├─ _lib/supabase.js          (2º client Supabase)
     ├─ _data/ (legal, mockProducts)
     └─ _utils/ (cors, logger, idempotency, internalAuth, rateLimit)
```

### Problemas
- **Middleware Clerk não cobre `api/*.js`** — cada serverless precisa autenticar sozinha.
- **Lógica duplicada**: pagamento/frete existem em `api/_services/*.js` **e** em `src/services/*.ts`.
- **Dois clients Supabase** (`api/_lib/supabase.js` e `src/lib/supabase.ts`) → risco de divergência.
- **JS sem tipos** nas rotas legadas → sem a rede de segurança do TypeScript.
- Convenções distintas (CORS manual, `req/res` vs `Request/Response`).

### Rotas e chamadas do front
| Rota | Superfície | Chamada no front |
|---|---|---|
| `/api/coupons/validate` | App Router ✅ | `useCartStore`, `CartContext` |
| `/api/auth/me` | App Router ✅ | `HeaderInteractive` |
| `/api/ai/size-recommendation` | App Router ✅ | `services/sizeAI` |
| `/api/payment/create-session` | serverless ⚠️ | `services/payment` |
| `/api/shipping/calculate` | serverless ⚠️ | `services/shipping` |
| `/api/payment/webhook` | serverless ⚠️ | gateway (externo) |
| `/api/erp/sync-order` | serverless ⚠️ | interno |
| `/api/erp/webhook-stock` | serverless ⚠️ | ERP (externo) |
| `/api/chat/route`, `/api/status` | serverless ⚠️ | diversos |

---

## Fase 1 — Unificar a superfície de API (App Router, TS)

**Objetivo:** aposentar `api/*.js`; toda rota vira `src/app/api/**/route.ts` em TypeScript, nascendo
com os controles de segurança já existentes.

**Como (strangler, rota a rota):** para cada rota legada, criar a versão App Router equivalente,
apontar o front para ela, validar, e **remover** a versão `.js`. A URL pública (`/api/...`) permanece
a mesma, então o front muda pouco.

| Origem (legado) | Destino (App Router) | Controles a adicionar |
|---|---|---|
| `api/payment/create-session.js` | `src/app/api/payment/create-session/route.ts` | Clerk `auth()`, `checkRateLimit('checkout')`, Zod, `logger` |
| `api/shipping/calculate.js` | `src/app/api/shipping/calculate/route.ts` | `checkRateLimit('shipping')`, Zod (remover `price` do input), `logger` |
| `api/payment/webhook.js` | `src/app/api/payment/webhook/route.ts` | assinatura HMAC (raw body via `req.text()`), idempotência |
| `api/erp/sync-order.js` | `src/app/api/erp/sync-order/route.ts` | `isAuthorizedInternal`, fail-closed |
| `api/erp/webhook-stock.js` | `src/app/api/erp/webhook-stock/route.ts` | segredo ERP, decremento atômico (RPC) |
| `api/chat/route.js`, `api/status.js` | `src/app/api/chat/route.ts`, `.../status/route.ts` | conforme sensibilidade |

**Reuso:** portar `api/_utils/*` para `src/lib/` (o `rate-limit.ts` já vive lá). Trocar o CORS manual
pelo modelo de headers do Next.

**Pronto quando:** pasta `api/` removida; front chamando só rotas App Router; build/testes verdes.
**Risco/rollback:** baixo — migração rota a rota; reverter é reapontar o front para a rota antiga
enquanto ela ainda existir (manter as duas até o cutover de cada rota).

---

## Fase 2 — Camada de domínio única (`src/server/`)

**Objetivo:** acabar com a duplicação e ter uma única regra de negócio tipada.

- Criar `src/server/` com serviços tipados: `payment`, `shipping`, `erp`, `coupon`, `order`,
  `inventory` — consolidando `api/_services/*.js` + `src/services/*.ts` numa fonte só.
- **Um** client Supabase server-side (`src/server/db.ts`), com o JWT do Clerk encaminhado para a RLS
  valer; `service_role` **apenas** para operações administrativas, nunca para leitura escopada por
  usuário.
- Tipos derivados de `src/types/supabase.ts` reutilizados nas rotas e no front (contratos únicos).
- Rotas de `src/app/api` viram "casca fina": validam entrada (Zod), chamam o serviço de domínio,
  formatam a resposta.

**Pronto quando:** zero duplicação payment/shipping; um único client Supabase; serviços cobertos por
testes unitários.
**Risco/rollback:** médio — mudança de organização interna; mitigar com testes por serviço antes do
corte.

---

## Fase 3 — Ciclo de vida do pedido orientado a eventos

**Objetivo:** dar escala e consistência ao núcleo transacional.

- **Fluxo:** `checkout → cria pedido (pending) → gateway → webhook (pago) → fila → workers`
  (confirmar pedido, decremento atômico de estoque, resgatar cupom, sincronizar ERP, enviar e-mail).
- **Fila:** Upstash QStash (já no ecossistema Upstash) ou equivalente.
- **Garantias:** idempotência ponta a ponta (chave por pedido/evento) e atomicidade — reusando a RPC
  `decrement_stock` e a tabela `coupon_redemptions` da migração `005_security_hardening.sql`.
- Mapear cada etapa aos 5 pilares da skill `ecommerce-security` (onde cada controle incide).

**Pronto quando:** webhook não faz trabalho pesado inline (só enfileira); reprocessar evento é seguro;
estoque nunca fica negativo sob concorrência.
**Risco/rollback:** médio — introduz infra assíncrona; começar por um worker simples e evoluir.

---

## Fase 4 — Futuro condicional (só quando os números pedirem)

Não fazer agora. Executar **apenas** se algum gatilho objetivo for atingido:

- **Monorepo (Turborepo)** com pacote `@lyvest/types` compartilhado — quando houver um 2º app
  (ex.: app mobile/Capacitor ou painel admin separado).
- **Extrair o núcleo transacional** para um serviço dedicado — quando: p95 de latência do checkout
  degradar sob carga, ou a fila sustentar picos que o serverless não acompanha, ou o time crescer a
  ponto de precisar de deploy independente do core.
  - Linguagem do serviço, em ordem de preferência: **TS (NestJS/Fastify)** para manter uma língua só;
    **Go** ou **.NET** se exigir concorrência/throughput muito altos; **Elixir/Phoenix** para
    real-time/alta concorrência com tolerância a falhas (menor pool de contratação).

**Regra de ouro:** não otimizar prematuramente. As Fases 1–3 resolvem o problema real hoje.

---

## Sequência recomendada e ligações

1. **Fase 1** (maior retorno imediato: mata a duplicação de superfície e fecha buracos de auth).
2. **Fase 2** (consolida o domínio, remove a duplicação de lógica).
3. **Fase 3** (escala do core).
4. **Fase 4** só sob gatilho.

Reusa o que já existe: `src/lib/rate-limit.ts`, `api/_utils/*` (a portar), helpers de `src/utils/*`
(validação/sanitização/logger), RLS `public.clerk_uid()` e a migração `005_security_hardening.sql`.
Todo endpoint transacional novo deve passar pelo checklist da skill `ecommerce-security`.
