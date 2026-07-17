# Guia de Segurança RLS — Supabase + Clerk

Este guia explica como o Row Level Security (RLS) protege os dados de usuário do Ly Vest.
**A stack de auth é Clerk** (não o Supabase Auth nativo). Isso muda tudo em relação aos
exemplos genéricos com `auth.uid()` — leia com atenção.

## Como funciona (o elo que faz o RLS valer)

1. O **Clerk** é a fonte de verdade da sessão. Ele emite um JWT cujo claim `sub` é o id do
   usuário (TEXT, ex.: `user_2abc...`).
2. O client do Supabase no browser (`src/lib/supabase.ts`) repassa esse JWT **em toda
   requisição**, via a opção `accessToken` (que lê `window.Clerk.session.getToken()`).
3. No Postgres, a função `public.clerk_uid()` lê o `sub` do JWT. As policies fazem
   `USING (public.clerk_uid() = user_id)`, isolando cada linha pelo dono.

Se qualquer elo faltar, `clerk_uid()` retorna `NULL` e o RLS **nega tudo** (ou, se alguém
afrouxar as policies para "funcionar", **expõe tudo** pela anon key pública). Por isso os
dois passos abaixo não são opcionais.

## Passo 1 — Infra (uma vez, no painel do Supabase)

Registre o Clerk como **Third-Party Auth provider**:

- Supabase Dashboard → **Authentication → Sign In / Providers → Third Party Auth → Clerk**.
- Informe o domínio do Clerk do projeto (ex.: `https://clerk.lyvest.com.br` ou o domínio
  `*.clerk.accounts.dev` em dev).

Sem isso, o Supabase não confia no JWT do Clerk e `clerk_uid()` fica sempre `NULL`.

> Referência: https://supabase.com/docs/guides/auth/third-party/clerk

## Passo 2 — Aplicar o RLS canônico

Execute **`supabase/migrations/006_clerk_rls_consolidation.sql`** no SQL Editor do Supabase.
Ele é a **fonte única da verdade** do RLS: remove as policies legadas com `auth.uid()`
(migrations 001/004), garante `user_id` como TEXT e recria as policies escopadas por
`public.clerk_uid()`.

> As migrations 001 e 004 usam `auth.uid()` (UUID) e estão **superadas** pela 006.
> Não as reaplique por cima da 006.

## Tabelas e regras

| Tabela | Leitura | Escrita |
|---|---|---|
| `products`, `categories` | Pública (catálogo/Vitrine) | Só via `service_role` (backoffice) |
| `profiles` | Próprio | Próprio |
| `orders` | Próprio | Próprio (a criação real deve ser **server-side**) |
| `addresses` | Próprio | Próprio |
| `favorites` | Próprio | Próprio |
| `reviews` | Aprovadas (pública) + próprias | Próprio (com verificação de compra server-side) |

## Verificação (obrigatória após aplicar)

1. Faça login como **usuário A** e crie um endereço.
2. Faça login como **usuário B**; tente ler/alterar/excluir o endereço de A pelo `id`.
3. **Esperado:** B não enxerga nem altera nada de A — retorno vazio, nunca erro 500.

Se B conseguir ver/alterar dados de A, o RLS não está ativo ou o provider do Clerk não foi
registrado (Passo 1). Pare o deploy até corrigir.

## Regra de ouro

- **Nunca** use a `service_role` key no client nem para leituras escopadas por usuário — ela
  ignora o RLS. Ela só entra em rotas server-side de backoffice/admin.
- Defesa em profundidade: mesmo com RLS, escopos de escrita no código devem incluir
  `.eq('user_id', user.id)` (ver `AddressSection.tsx`).

## Referências
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase + Clerk (Third-Party Auth)](https://supabase.com/docs/guides/auth/third-party/clerk)
