# Pilar 3 — Controle de Acesso (BOLA / IDOR)

## O risco
**IDOR/BOLA**: o Usuário A troca um `id` na URL/API e lê ou altera o pedido, endereço ou
perfil do Usuário B. A regra: **autorização é decidida no servidor pelo ID do usuário
logado**, nunca por um parâmetro que o cliente controla.

## Identifique o usuário no servidor (Clerk)

```ts
import { auth, currentUser } from '@clerk/nextjs/server';

const { userId } = await auth();
if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
```

## Escope toda query pelo ID do logado

```ts
// ✅ o recurso é buscado JÁ filtrado pelo dono
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .eq('user_id', userId)   // dono = logado
  .single();
if (!data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
```
```ts
// ❌ confia no user_id vindo do corpo/URL — IDOR
.eq('user_id', body.userId)
```

## Defesa em profundidade: RLS no banco

O filtro na aplicação é a primeira camada; **RLS é o portão real**. Neste repo a RLS usa o
`sub` do JWT do Clerk via `public.clerk_uid()` (ver `SUPABASE_SETUP.sql`):

```sql
CREATE POLICY "User View Own Orders" ON public.orders
  FOR SELECT USING (public.clerk_uid() = user_id);
```

Para a RLS funcionar no servidor, o **JWT do Clerk precisa ser encaminhado ao Supabase**
(cliente autenticado por request). Não confie apenas no cliente anon global.

## Duas superfícies de API — atenção
- `src/app/api/**/route.ts`: cobertas pelo `middleware.ts` (Clerk) **se** a rota estiver no
  matcher. Ainda assim, faça a checagem de posse na query.
- `api/**/*.js` (serverless Vercel): o `middleware.ts` **não** as protege. Cada função
  precisa autenticar por conta própria (verificar sessão/JWT) e escopar por usuário.

## Autorização interna (webhooks/ERP) — fail-closed
```js
// ✅ nega sempre que a chave não bater, inclusive fora de produção; tempo constante
import { timingSafeEqual } from 'node:crypto';
const expected = `Bearer ${process.env.INTERNAL_API_KEY}`;
const got = req.headers.authorization || '';
const ok = expected.length === got.length &&
           timingSafeEqual(Buffer.from(expected), Buffer.from(got));
if (!process.env.INTERNAL_API_KEY || !ok) return res.status(401).json({ error: 'Unauthorized' });
```
Nunca "libera em dev" uma rota de escrita sensível — isso escapa em previews/staging.

## Regras
- Nunca use `service_role` (ignora RLS) para leitura escopada por usuário.
- Um único modelo de auth por tabela (não misturar `auth.uid()` UUID com `clerk_uid()` TEXT).
- Erros de "não autorizado" e "não encontrado" não devem revelar existência de recurso alheio.

## Como testar
- Logado como A, tente `GET /api/orders/<id_de_B>` e `PUT`/`DELETE` no recurso de B →
  401/404, nunca sucesso.
- Desligue a RLS num ambiente de teste e confirme que a checagem de aplicação ainda barra.
