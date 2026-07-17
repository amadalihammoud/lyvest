# 🔒 Checklist de Segurança - Ly Vest

Este documento contém verificações de segurança que devem ser realizadas antes de cada deploy em produção.

---

## ✅ Pré-Deploy Checklist

### 1. Variáveis de Ambiente
- [ ] Nenhuma chave de API exposta no código-fonte
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] `CLERK_SECRET_KEY` configurado apenas no servidor
- [ ] `OPENAI_API_KEY` configurado apenas no servidor (nunca com prefixo `NEXT_PUBLIC_`)
- [ ] `UPSTASH_REDIS_REST_URL`/`TOKEN` configurados (sem eles, rate limit e idempotência
      ficam DESATIVADOS — o app agora loga `[SECURITY]` em produção quando faltam)
- [ ] Nenhum segredo com prefixo `NEXT_PUBLIC_` (só o que é público de fato)
- [ ] Verificar que `.env.local` está no `.gitignore`

### 2. Headers de Segurança
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Content-Security-Policy` configurado
- [ ] `Strict-Transport-Security` (HSTS) habilitado
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` restritivo

### 3. Autenticação (Clerk)
- [ ] Autenticação gerenciada pelo Clerk (o app não guarda senhas)
- [ ] `CLERK_SECRET_KEY` apenas no servidor; `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` no cliente
- [ ] Rotas protegidas no `middleware.ts` (dashboard, checkout)
- [ ] JWT do Clerk propagado ao Supabase (Third-Party Auth) para o RLS funcionar
- [ ] Rate limiting nas rotas do Cofre (checkout, cupom, IA, formulários)

### 4. Inputs e Formulários
- [ ] Validação client-side e server-side
- [ ] Sanitização de inputs HTML (DOMPurify)
- [ ] Proteção contra SQL Injection (Supabase RLS)
- [ ] Proteção contra XSS
- [ ] CSRF tokens em formulários críticos

### 5. APIs e Dados
- [ ] Row Level Security (RLS) habilitado no Supabase (migration `006_clerk_rls_consolidation.sql`)
- [ ] Clerk registrado como **Third-Party Auth** no Supabase (senão o RLS nega tudo — ver docs/SECURITY_RLS.md)
- [ ] Teste de isolamento com **dois usuários** (A não vê/altera dados de B) executado e aprovado
- [ ] Endpoints sensíveis autenticados
- [ ] Rate limiting em APIs (tiers em `src/lib/rate-limit.ts`, incluindo `ai`)
- [ ] Nenhum dado sensível em logs
- [ ] Dados de pagamento não armazenados localmente

### 6. Pagamento (PCI-DSS) — portão de go-live
- [ ] **Não coletar PAN/CVV em campos próprios.** Antes de ligar cobrança real, substituir os
      campos de cartão do checkout pelos *hosted fields*/SDK do gateway (Stripe Elements,
      Mercado Pago SDK ou checkout hospedado), de modo que o número do cartão e o CVV
      **nunca** toquem o React state nem o backend.
- [ ] CVV nunca é armazenado nem logado (proibido por PCI-DSS).
- [ ] Valor cobrado é **recomputado no servidor** (preços do banco + cupom revalidado) —
      já implementado em `POST /api/payment/create-session` e, na persistência do pedido,
      na RPC `public.create_order` (o total/desconto do cliente é ignorado).
- [ ] Pedido é persistido de forma **atômica** via `POST /api/orders` → RPC `create_order`
      (migration `008`): baixa de estoque condicional (`stock >= qty`), cupom de uso único
      registrado em `coupon_redemptions` (constraint `UNIQUE`) e total recomputado — tudo na
      mesma transação (Pilares 1 e 2). Aplicar migrations `007` (fix `decrement_stock` UUID)
      e `008` no Supabase antes do go-live.
- [ ] Go-live com gateway real: chamar `POST /api/orders` na **confirmação** do pagamento
      (webhook `payment_intent.succeeded`), não antes de pagar.
- [ ] Webhook de pagamento com verificação de assinatura HMAC ativa (`PAYMENT_WEBHOOK_SECRET`).

### 7. Dependências
- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] Dependências atualizadas
- [ ] Verificar licenças das dependências

---

## 🔍 Verificações Manuais

```bash
# 1. Verificar vulnerabilidades de dependências
npm audit

# 2. Verificar se há segredos no código
git log --all --full-history -- "*.env*"

# 3. Verificar headers de segurança (após deploy)
curl -I https://lyvest.com.br

# 4. Verificar CSP
curl -s https://lyvest.com.br | grep "Content-Security-Policy"
```

---

## 🚨 Em Caso de Incidente

### 1. Vazamento de Credenciais
1. Revogar imediatamente as credenciais vazadas
2. Gerar novas credenciais
3. Atualizar variáveis de ambiente
4. Verificar logs de acesso
5. Notificar usuários afetados (se aplicável)

### 2. Brecha de Segurança
1. Isolar o sistema afetado
2. Documentar o incidente
3. Aplicar patches
4. Conduzir análise post-mortem
5. Atualizar este checklist

---

## 📋 Headers Configurados (vercel.json)

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `Content-Security-Policy` | (configurado) | Previne XSS e injeções |
| `X-XSS-Protection` | `1; mode=block` | Proteção XSS legada |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controle de referrer |
| `Permissions-Policy` | (restritivo) | Desabilita APIs sensíveis |
| `Strict-Transport-Security` | `max-age=31536000...` | Força HTTPS |

---

## 🔐 Supabase RLS Policies

Fonte da verdade: `supabase/migrations/006_clerk_rls_consolidation.sql`. Escopo por
`public.clerk_uid()` (JWT do Clerk), não `auth.uid()`. Verificar que estão ativas:

| Tabela | Policy | Descrição |
|--------|--------|-----------|
| `profiles` | `select/insert/update own` | Usuário gerencia apenas o próprio perfil |
| `orders` | `select/insert own` | Usuário vê apenas os próprios pedidos |
| `addresses` | `select/all own` | CRUD apenas para o próprio usuário |
| `favorites` | `select/all own` | CRUD apenas para o próprio usuário |
| `reviews` | `select approved/insert own` | Lê aprovadas; escreve só as próprias |
| `products`, `categories` | `select` | Público para leitura (catálogo) |

---

## 📊 Monitoramento

- [ ] Sentry configurado para captura de erros
- [ ] Vercel Analytics ativo
- [ ] Alertas de erros críticos configurados
- [ ] Logs de autenticação habilitados

---

## 🔄 Revisão Periódica

- **Semanal**: `npm audit`, verificar logs de acesso
- **Mensal**: Revisar permissões Supabase, atualizar dependências
- **Trimestral**: Pentest simplificado, revisar CSP

---

*Última revisão: 09/07/2026*
*Próxima revisão: 09/08/2026*
