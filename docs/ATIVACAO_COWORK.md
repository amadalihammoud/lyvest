# Briefing de Ativação de Segurança — lyvest

> **Como usar:** cole este documento inteiro numa sessão do **Claude Cowork** que tenha o
> **Claude for Chrome** habilitado (para operar os painéis Supabase/Clerk/Vercel), OU
> simplesmente diga ao agente: *"leia `docs/ATIVACAO_COWORK.md` e execute, seguindo a ordem
> e as travas de segurança"*. O agente tem acesso a este repositório.

Você (agente) é o Opus 4.8. Sua missão é **ativar em produção** as correções de segurança já
commitadas na branch `claude/lyvest-ecommerce-security-eg3x5o`, executando as ações de infra
nos painéis de terceiros (via Claude for Chrome) e depois promovendo a branch.

---

## ⚠️ Regras de segurança (leia antes de tudo)

1. **Nunca** exponha segredos em chat, commits, logs ou capturas de tela. Cole valores
   sensíveis (service_role, tokens) **direto no campo do painel**, não os repita no chat.
2. **Ordem é obrigatória** (abaixo). Especialmente: **NÃO** ligue a flag
   `NEXT_PUBLIC_SUPABASE_CLERK_AUTH=true` antes de o Clerk estar habilitado como Third-Party
   Auth no Supabase — senão o banco rejeita o token e o dashboard quebra (401).
3. **Confirme com o usuário** (humano) antes de qualquer ação **irreversível** ou que afete
   **produção**: rodar migração, promover a branch, apagar dados. Descreva o que vai fazer.
4. **Teste no preview antes da produção** sempre que possível.
5. `service_role` é chave de administrador do banco — vai **só** em env server-side na Vercel,
   **jamais** com prefixo `NEXT_PUBLIC_`, jamais no código/bundle.
6. Se algo divergir do esperado (UI diferente, erro), **pare e reporte** ao usuário em vez de
   improvisar em produção.

---

## Contexto do que já está pronto (no código)

Branch `claude/lyvest-ecommerce-security-eg3x5o` já contém, verificado (tsc/lint/build/testes):
- Rate limit nas rotas de IA, anti-spoof de IP, reserva atômica de cupom, frete relê preço do
  banco, Sentry Replay mascarado, escopo de endereço por `user_id`, fix de CORS.
- Migrações `supabase/migrations/005_*.sql`, `006_*.sql`, `007_*.sql` (RLS + fulfillment).
- Wiring Clerk→Supabase via `accessToken`, **atrás da flag** `NEXT_PUBLIC_SUPABASE_CLERK_AUTH`.
  O client chama `window.Clerk.session.getToken()` **sem template** → exige a integração
  **nativa Third-Party Auth** (NÃO a JWT template legada).

Stack: Next.js 16 · Clerk · Supabase (RLS via `public.clerk_uid()`) · Upstash · Vercel.
Projeto Vercel: `lyvest` (team `amadteam`). Domínio prod: `lyvest.com.br`. Domínio Clerk
(pela CSP): `clerk.lyvest.com.br`.

---

## PASSO 1 — Supabase: RLS + migrações (SQL Editor)

Abra o painel do Supabase do projeto → **SQL Editor**.

### 1a. Diagnóstico (rode e me mostre o resultado)
```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
  and tablename in ('addresses','orders','order_items','order_history',
                    'favorites','profiles','reviews','coupon_redemptions','products');
```
> Se **qualquer** linha vier `rowsecurity = false`, é o cenário crítico (dados expostos pela
> anon key). Prossiga para 1b imediatamente.

### 1b. Garantir RLS ligada (idempotente — seguro rodar sempre)
```sql
alter table public.addresses     enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.order_history enable row level security;
alter table public.favorites     enable row level security;
alter table public.profiles      enable row level security;
alter table public.reviews       enable row level security;
```

### 1c. Rodar as migrações, **nesta ordem**
Leia o conteúdo de cada arquivo no repo e execute no SQL Editor, um de cada vez:
1. `supabase/migrations/005_security_hardening.sql` (se ainda não rodada)
2. `supabase/migrations/006_order_fulfillment.sql`
3. `supabase/migrations/007_rls_reconcile_clerk.sql`

Confirme que cada uma roda sem erro. Elas recriam as policies com `public.clerk_uid()` e criam
`decrement_stock`, `coupon_redemptions`, `mark_order_paid`, `orders.coupon_code`.

### 1d. Validar que as policies existem
```sql
select tablename, policyname from pg_policies
where schemaname='public'
  and tablename in ('addresses','orders','favorites','profiles','reviews','coupon_redemptions')
order by tablename;
```

---

## PASSO 2 — Clerk ↔ Supabase: Third-Party Auth (nativo)

Objetivo: fazer o token do Clerk ser aceito pelo Supabase, para `clerk_uid()` resolver o `sub`.

**Use a integração NATIVA "Third-Party Auth"** (não a JWT template legada), porque o código
chama `getToken()` sem template.

Siga o guia oficial atual (a UI muda; adapte):
- Clerk: https://clerk.com/docs/integrations/databases/supabase
- Supabase: Dashboard → **Authentication → Sign In / Providers → Third-Party Auth → Add Clerk**.

Passos típicos:
1. No **Supabase** → Authentication → Third-Party Auth → **Add provider → Clerk**. Ele pede o
   **Clerk domain** (a Frontend API URL). Use `clerk.lyvest.com.br` (confirme no painel do Clerk
   em API Keys / Domains).
2. No **Clerk**, habilite a integração Supabase se solicitado, garantindo que o token de sessão
   inclua o claim `role: "authenticated"` (a integração Supabase do Clerk cuida disso).
3. Salve. Não é preciso mexer no `clerk_uid()` — ele já lê `request.jwt.claim.sub`.

**Não prossiga** para ligar a flag até este passo estar concluído e salvo.

---

## PASSO 3 — Vercel: variáveis de ambiente (Settings → Environment Variables)

Projeto `lyvest` → **Settings → Environment Variables**. Primeiro **liste as existentes** e só
**adicione as que faltarem** (algumas podem já existir). Marque escopo **Production** (e Preview
quando fizer sentido).

| Variável | Valor / origem | Observação |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → chave **service_role** | ⚠️ server-side; ativa o fulfillment (estoque/cupom) |
| `PAYMENT_WEBHOOK_SECRET` | gerar aleatório (`openssl rand -hex 32`) | usado no HMAC do webhook de pagamento |
| `UPSTASH_REDIS_REST_URL` | Upstash console → Redis DB → REST API | rate limit + idempotência |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console → Redis DB → REST API | idem |
| `INTERNAL_API_KEY` | gerar aleatório | auth de `erp/sync-order` (`Bearer ...`) |
| `ERP_WEBHOOK_SECRET` | gerar aleatório | auth de `erp/webhook-stock` (header) |
| `NEXT_PUBLIC_APP_URL` | `https://lyvest.com.br` | público, ok |

> **NÃO adicione ainda** `NEXT_PUBLIC_SUPABASE_CLERK_AUTH`. Ela é o gatilho e vai por último
> (Passo 4), só depois do Passo 2 concluído.

---

## PASSO 4 — Ligar a flag do Clerk↔Supabase

Somente **após** Passo 2 (Clerk Third-Party Auth ativo) e Passo 3 (service_role setado):
- Adicione na Vercel (Production **e** Preview): `NEXT_PUBLIC_SUPABASE_CLERK_AUTH` = `true`.

---

## PASSO 5 — Promover para produção

1. **Confirme com o usuário** antes de promover.
2. Faça o merge da branch `claude/lyvest-ecommerce-security-eg3x5o` → `main` (via GitHub) OU
   avise que eu (na sessão de código) posso fazer o merge.
3. A Vercel dispara o deploy de produção automaticamente. Como as env vars mudaram, **force um
   novo deploy** se necessário (Deployments → Redeploy) para que peguem.

---

## PASSO 6 — Verificação end-to-end (no `lyvest.com.br`)

Faça login e valide (idealmente primeiro no **preview**, depois em prod):
1. **Dashboard → Endereços:** adicionar, editar e excluir um endereço → deve **persistir**
   (prova que RLS + JWT do Clerk funcionam). Se der erro/401 → o Passo 2 não está correto;
   **reverta a flag para `false`** e reporte.
2. **Favoritos:** favoritar/desfavoritar logado → persiste entre sessões.
3. **Cupom:** aplicar `BEMVINDA10` no carrinho → desconto aplicado; tentar reusar (uso único).
4. **Checkout:** criar sessão de pagamento sem erro; conferir nos logs da Vercel que o pedido
   `pending` foi persistido (com service_role setado).
5. **Chat (Ly):** abrir, mandar mensagem, pedir "quero comprar X" → resposta + botão de carrinho.
6. **Logs Vercel:** sem o alerta `[rate-limit] ... fail-open` (Upstash setado) e sem erros 5xx.

### Critério de "pronto"
- RLS `true` em todas as tabelas de usuário; policies com `clerk_uid()` presentes.
- Dashboard de endereços funciona **logado** e falha para não-dono (RLS ativa).
- Deploy de produção verde; smoke tests acima passam.

---

## Se algo der errado
- Dashboard quebrou após ligar a flag → o Clerk Third-Party Auth não está aceito pelo Supabase.
  **Reverta** `NEXT_PUBLIC_SUPABASE_CLERK_AUTH` para `false` (volta ao comportamento atual),
  redeploy, e reporte para revisão do Passo 2.
- Migração falhou → não force; copie a mensagem de erro e reporte.
- Em qualquer dúvida sobre ação irreversível/produção → **pare e pergunte ao usuário.**
