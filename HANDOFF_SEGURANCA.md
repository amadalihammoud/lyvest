# 🔐 Relatório de Handoff — Segurança & Estrutura do LyVest

> **Documento para continuar o trabalho de outra sessão / contexto.**
> Copie e cole este arquivo inteiro para retomar de onde paramos.

---

## ⚠️ ANTES DE TUDO: SINCRONIZE (local ≠ GitHub)

**Todo o trabalho abaixo foi commitado e enviado para o GitHub, no branch
`claude/lyvest-security-analysis-teptum`.** A pasta do projeto **no seu computador
pode estar DESATUALIZADA** — ela NÃO recebe os commits automaticamente. Se você
continuar sem sincronizar, vai trabalhar em cima de código velho e pode sobrescrever
o que foi feito.

**Sincronize primeiro (rode no seu computador, na pasta do projeto):**

```bash
git fetch origin
git checkout claude/lyvest-security-analysis-teptum
git pull origin claude/lyvest-security-analysis-teptum
npm install        # dependências podem ter mudado
```

Se der conflito ou você tiver alterações locais não salvas, resolva/guarde
(`git stash`) antes. Só comece a trabalhar depois que
`git log --oneline -1` mostrar o commit **`bf59388`** (ou mais recente).

---

## ✅ O QUE JÁ FOI FEITO (8 commits, tudo no GitHub)

Branch: `claude/lyvest-security-analysis-teptum`

| Commit | Descrição |
|--------|-----------|
| `6dff8ed` | Ponte Clerk↔Supabase (RLS passa a funcionar) + rotas de IA com rate limit/Zod + hardening (fail-open barulhento, IP não-forjável, Sentry PII, CSP única) |
| `fa56ef2` | Revalidação de cupom no servidor (Zero-Trust) + reviews com verificação de compra e moderação |
| `520e5cf` | Correção do "Algo deu errado" em produção (ChunkLoadError do PWA) + stack trace só em dev |
| `8296068` | Fix do tipo da RPC `decrement_stock` (UUID) — baixa de estoque atômica volta a funcionar |
| `37123f5` | Persistência ATÔMICA de pedido + baixa de estoque + cupom de uso único (RPC `create_order`, rota `/api/orders`) |
| `eb3cd7f` | Dashboard lê os pedidos reais do banco (fecha o ciclo de persistência) |
| `e1c1265` | Unifica o limite de frete grátis (era 150/199/300 divergentes → fonte única R$199) |
| `bf59388` | Migra código de segurança do servidor de `.js` para `.ts` + corrige 3 bugs latentes que a tipagem expôs |

### Resumo por área

**Segurança (os 5 pilares):**
- **Controle de acesso (IDOR/RLS):** o client do browser agora envia o JWT do Clerk ao
  Supabase, então o RLS isola dados por usuário. Escritas de endereço escopadas por
  `user_id` (defesa em profundidade). RLS consolidado num único modelo Clerk (migration 006).
- **Rotas de IA** (`/api/chat`, `/api/ai/size-recommendation`): rate limit + validação Zod
  (fecha o vetor de esgotar o orçamento da OpenAI).
- **Cupom:** desconto revalidado e recomputado no servidor; cliente não é mais confiado.
- **Reviews:** só quem comprou avalia; gravado como `approved=false` (moderação).
- **Hardening:** rate-limit/idempotência gritam no log se o Redis faltar em produção;
  `getClientIp` usa header não-forjável; Sentry mascara PII; CSP com fonte única.

**Pedido/estoque (Pilares 1 e 2):**
- RPC `create_order` (migration 008): atômica, lê preço da fonte da verdade, baixa estoque
  condicional, registra cupom de uso único, recomputa total — tudo numa transação.
- Rota `POST /api/orders` chama a RPC com o token do Clerk.
- Dashboard mostra os pedidos reais do banco.

**Estrutura:**
- Frete grátis unificado (bug visível ao cliente corrigido).
- Código de segurança do servidor migrado para TypeScript (`logger`, `internalAuth`,
  `idempotency`, `server/supabase`).

---

## 🛠️ O QUE DEPENDE DE VOCÊ (não é código — precisa ser feito no painel/DB)

Sem estes passos, o RLS e o fluxo de pedido **não funcionam** em produção.

1. **Aplicar as migrations no Supabase**, no SQL Editor, **nesta ordem**:
   - `supabase/migrations/006_clerk_rls_consolidation.sql`
   - `supabase/migrations/007_fix_decrement_stock_uuid.sql`
   - `supabase/migrations/008_create_order_rpc.sql`
   - `supabase/migrations/009_add_promotional_price.sql`

2. **Registrar o Clerk como Third-Party Auth no Supabase:**
   Dashboard → Authentication → Sign In / Providers → Clerk (informar o domínio do Clerk).
   *Sem isso, `clerk_uid()` retorna NULL e o RLS nega tudo.* Passo a passo em
   `docs/SECURITY_RLS.md`.

3. **Teste de isolamento obrigatório:** logar como usuário A, criar endereço/pedido; logar
   como usuário B e tentar ver/alterar os dados de A. B **não** pode ver nada de A.

4. **Confirmar variáveis de ambiente em produção** (Vercel):
   `UPSTASH_REDIS_REST_URL`/`TOKEN` (senão rate limit e idempotência ficam desligados),
   `PAYMENT_WEBHOOK_SECRET`, `OPENAI_API_KEY`, chaves do Clerk/Supabase.

---

## 📋 O QUE FALTA FAZER (código — ordem sugerida)

### Alta prioridade (antes de ligar pagamento real / go-live)
1. **Fechar o ciclo do pagamento no webhook** (`src/app/api/payment/webhook/route.ts`):
   marcar o pedido como `paid` quando o gateway confirmar. Requer:
   - Inverter o fluxo: criar o pedido (`create_order`, status `pending`) **antes** de abrir
     a sessão de pagamento e mandar o `orderId` no metadata, para o gateway devolvê-lo.
   - Um client Supabase com `service_role` (server-only) — o webhook não tem JWT do usuário.
   - Update idempotente `pending` → `paid`.
2. **PCI-DSS / tokenização:** substituir os campos de cartão (número + CVV) do checkout
   pelos *hosted fields*/SDK do gateway (Stripe Elements, Mercado Pago SDK ou checkout
   hospedado), para que o cartão **nunca** toque o React nem o backend.

### Média prioridade (estrutura / qualidade — não bloqueia segurança)
3. **Migrar os `.js` restantes para `.ts`** (parei aqui de propósito — ver abaixo):
   - `src/server/services/{payment,shipping,erp,products}.js` (providers **mock**)
   - `src/server/data/{legal,mockProducts}.js`
   - `src/app/api/chat/route.js`
   - ⚠️ **NÃO migrar** `src/utils/empty-module.js` — é um stub CommonJS do webpack, deve
     continuar `.js`.
   - ⚠️ Atenção: `products.js` seleciona colunas `image` e `specs` que **não existem** no
     tipo/schema (`products` tem `image_url`, e não há `specs`). Migrar para TS exige
     reconciliar isso primeiro (senão vira `any`). Foi por isso que parei.
4. **Desduplicar camadas de serviço:** existe `src/services/payment.ts` (cliente) e
   `src/server/services/payment.js` (servidor) com nome igual — confunde. Idem `shipping`.
   Sugestão: renomear `server/services/*` para `server/providers/*`.
5. **Frete grátis a partir do banco:** hoje o limite é uma constante (R$199). O ideal é ler
   de `financial_configs.free_shipping_threshold` (já existe no seed = 199,90).

### Baixa prioridade
6. `financial_configs` e cupons poderiam sair do código (`src/config/coupons.ts`) para o
   banco, com painel de administração.

---

## 🧭 COMO CONTINUAR (cole isto numa nova sessão do Claude Code)

> Estou retomando o trabalho de segurança do e-commerce **LyVest**. O trabalho anterior
> está no branch **`claude/lyvest-security-analysis-teptum`** (já no GitHub). **Antes de
> qualquer coisa, sincronize a pasta local com o GitHub** (`git fetch` + `git checkout` +
> `git pull` desse branch) porque a pasta local pode estar atrasada. Confirme que o último
> commit é `bf59388` ou mais recente. Depois, leia o arquivo `HANDOFF_SEGURANCA.md` na raiz
> do projeto e continue pela seção "O QUE FALTA FAZER", começando pelo item que eu indicar.
> Use a skill `ecommerce-security` como portão de qualidade e rode `lint`, `tsc --noEmit` e
> `npm run build` antes de cada commit.

---

## 📊 Estado técnico
- **Lint, typecheck (`tsc --noEmit`), build (`npm run build`) e testes (`npm run test:unit`): todos verdes.**
- Branch sincronizado com `origin` (nada pendente de push no ambiente onde o trabalho foi feito).
- 9 arquivos SQL em `supabase/migrations/` (aplicar 006–009).
- Documentação atualizada: `docs/SECURITY_RLS.md`, `SECURITY_CHECKLIST.md`.

*Gerado ao fim da sessão de segurança. Branch: `claude/lyvest-security-analysis-teptum`.*
