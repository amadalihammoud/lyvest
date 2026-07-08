---
name: ecommerce-security
description: >-
  Portão de segurança (AppSec / Secure by Design) para e-commerce: valida cada feature
  contra 5 pilares defensivos — Zero-Trust de preço/desconto, race conditions, controle
  de acesso (IDOR/BOLA), anti-bot com preservação de SEO/GEO, e injeção/PII. Use ao criar
  ou alterar checkout, pagamento, cupom, desconto, frete, pedido, endereço, carrinho,
  autenticação/login, reset de senha, webhook, upload, rota de API (GET/POST/PUT/DELETE)
  ou query no banco — validando o código contra o checklist de aceite antes de entregar.
  Escopo estritamente defensivo (sistemas próprios), nunca ofensivo/ataque a terceiros.
---

# 🛡️ Security Gate — E-commerce (Secure by Design)

## ⚠️ Escopo e ética (leia primeiro)

Esta skill é **estritamente defensiva e construtiva**. Serve **exclusivamente** para
fortificar, auditar e construir os sistemas **próprios** de e-commerce. Em hipótese
alguma os conceitos aqui são para explorar vulnerabilidades de terceiros, ataque
externo ou qualquer atividade ofensiva. Foco total: **AppSec** e **Secure by Design**.

> Nenhum sistema é literalmente "invulnerável". O objetivo alcançável é **defesa em
> profundidade**: minimizar a superfície de ataque e **bloquear estruturalmente** as
> classes de ataque comuns de e-commerce. É isso que faz o sistema resistir a um pentest.

## 🎯 O que esta skill é

Um **portão de qualidade de segurança** (critérios rigorosos de aceite), **agnóstico de
tecnologia**, focado no **comportamento defensivo do sistema** — não em gerar snippets.

**Como usar (obrigatório):** toda vez que você (Claude) for criar ou alterar uma feature,
**antes de entregar o código**, valide-o contra o
[checklist de aceite](references/checklist-de-aceite.md). Se qualquer item der FAIL,
corrija antes de entregar. Se um pilar não se aplicar à mudança, diga explicitamente por quê.

## 🧱 Os 5 pilares (resumo)

1. **Zero-Trust Front-End — falhas lógicas de negócio.**
   Jamais confiar em preço, quantidade, desconto, cupom, frete ou status vindos do
   client. Toda transação é **recalculada e revalidada na fonte da verdade** (backend/banco).
   → [`references/01-logica-de-negocio.md`](references/01-logica-de-negocio.md)

2. **Prevenção de Race Conditions — concorrência.**
   Requisições simultâneas em operações críticas não podem causar dedução dupla de
   estoque, uso múltiplo de cupom único ou pagamento duplicado. Use operações **atômicas**
   e **idempotência**.
   → [`references/02-concorrencia.md`](references/02-concorrencia.md)

3. **Controle de Acesso (BOLA / IDOR).**
   Autorização estrita pelo ID do usuário logado. O Usuário A **nunca** lê, altera ou
   deleta pedidos, endereços ou dados do Usuário B manipulando parâmetros de URL/API.
   → [`references/03-controle-de-acesso.md`](references/03-controle-de-acesso.md)

4. **Anti-Bot com preservação de GEO/SEO — o "Cofre vs. Vitrine".**
   Rate limiting escalonado e detecção de anomalias **só em rotas transacionais/sensíveis**
   (Cofre: login, reset, checkout, POST/PUT). Rotas públicas de catálogo/conteúdo
   (Vitrine: GET) ficam **abertas e otimizadas para crawlers de IA** (OpenAIbot,
   Googlebot). Bloquear automação maliciosa (card testing, credential stuffing, scanners)
   por **comportamento**, não por bloqueio cego de IP.
   → [`references/04-anti-bot-seo.md`](references/04-anti-bot-seo.md)

5. **Proteção e Sanitização Universal.**
   Blindagem em todas as camadas contra injeção (SQL/NoSQL) independente do ORM, e
   garantia de que nenhum dado sensível (PII) vaza em respostas de API ou logs de erro.
   → [`references/05-injecao-e-pii.md`](references/05-injecao-e-pii.md)

## ♻️ Reuso — utilitários que JÁ existem neste repo (não reimplementar)

- **Validação:** `src/utils/schemas.ts` (`validateForm`, `addressSchema`, `paymentSchema`) e
  `src/utils/validation.ts` (`isValidCPF`, `isValidCreditCard`/Luhn, `sanitizeString`,
  `obfuscateSensitiveData`, `maskCPF`).
- **Sanitização / headers:** `src/utils/security.ts` (`detectXSS`, `escapeHTML`,
  `securityHeaders`, `detectBot`, `createHoneypot`, `isValidOrigin`).
- **Log seguro (gated por ambiente):** `src/utils/logger.ts` — use no lugar de `console.*`.
- **Rate limiting distribuído:** `src/lib/rate-limit.ts` (sobre `src/services/redis.ts` +
  `@upstash/ratelimit`).
- **Recálculo server-side de preço (referência):** `api/payment/create-session.js`
  ("só confie em IDs + quantidades").
- **RLS por usuário:** `SUPABASE_SETUP.sql` — `public.clerk_uid()` + policies
  `USING (public.clerk_uid() = user_id)`.

## 🧩 Contexto de arquitetura deste repo

Stack real: **Next.js 16 (App Router) · React 19 · Clerk · Supabase (RLS) · Upstash ·
Zod · Sentry · Vercel**. (Os docs antigos falam em Vite/Supabase-Auth — desatualizados.)

⚠️ Existem **duas superfícies de API**: `src/app/api/**/route.ts` (App Router, protegida por
`middleware.ts`/Clerk) e `api/**/*.js` (funções serverless Vercel — **NÃO** cobertas pelo
middleware). Toda função em `api/*.js` precisa fazer sua **própria** autenticação, validação
e rate limiting. Trate a existência de duas superfícies como um smell a consolidar.

## 📚 References

| Arquivo | Pilar |
|---|---|
| [`references/checklist-de-aceite.md`](references/checklist-de-aceite.md) | Portão consolidado (todos) |
| [`references/01-logica-de-negocio.md`](references/01-logica-de-negocio.md) | 1 · Zero-Trust |
| [`references/02-concorrencia.md`](references/02-concorrencia.md) | 2 · Race conditions |
| [`references/03-controle-de-acesso.md`](references/03-controle-de-acesso.md) | 3 · BOLA/IDOR |
| [`references/04-anti-bot-seo.md`](references/04-anti-bot-seo.md) | 4 · Anti-bot + SEO |
| [`references/05-injecao-e-pii.md`](references/05-injecao-e-pii.md) | 5 · Injeção + PII |
| [`references/evals.md`](references/evals.md) | Triggering + cobertura (regressão) |

**Não duplicar** o que já existe no repo: `SECURITY_CHECKLIST.md` (checklist de deploy),
`docs/SECURITY_RLS.md` (guia RLS) e `SECURITY.md` (política de divulgação). Esta skill é o
gate de **runtime/feature**; aqueles são de processo/infra.
