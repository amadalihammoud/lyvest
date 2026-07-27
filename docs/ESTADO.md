# Estado do projeto — 27/07/2026

Documento de continuidade. Registra o que está em andamento, o que foi
verificado (e como), e o que ainda não existe. Escrito para que uma sessão nova
retome sem redescobrir nada.

---

## 1. Frente em andamento: importar grade do Bling

Objetivo: um produto com tamanhos vira **1 produto + N variantes**, comprável
com seleção de tamanho e estoque correto por tamanho.

| Etapa | O quê | Situação |
|---|---|---|
| 1 | Interpretar o payload do Bling (`src/server/bling/variations.ts`, puro, 17 testes) | ✅ feito |
| 2 | Sync grava pai + variantes e pula os filhos | ✅ feito e verificado em produção |
| 2a | Despromover clones que já existiam como produto | ✅ feito |
| 3 | API e PDP expõem as variantes | ❌ **não iniciado** |
| 4 | Seletor de tamanho + carrinho carregam `variantId` | ❌ **não iniciado** |
| 5 | Zod e `create_order` aceitam `variantId` | ❌ **não iniciado** |

### ⚠️ Janela conhecida e ACEITA

A partir da etapa 2, `create_order` exige `variantId` para produto que tenha
variante ativa (`EXISTS` na função SQL). O checkout **ainda não envia** esse
campo, e o schema Zod de `/api/payment/create-session` descarta chave
desconhecida.

**Consequência: o produto com grade NÃO é comprável até a etapa 5 terminar.**

Hoje isso é inofensivo porque só existe produto de teste. Deixa de ser no
momento em que houver catálogo real.

### Como o Bling representa grade (verificado na API real, não na doc)

A **listagem** (`/produtos?criterio=2`) devolve pai e filhos lado a lado, sem
nenhum vínculo entre eles:

```
{ id: 16682830009, nome: 'Sutiã Renda Comfort',           formato: 'V' }  ← pai
{ id: 16682834177, nome: 'Sutiã Renda Comfort Tamanho:P', formato: 'S' }  ← filho
```

- `formato: 'V'` = pai de grade · `'S'` = simples ou filho · `'E'` = composição
- O vínculo **só** aparece em `GET /produtos/{id}` do pai, no campo `variacoes[]`:

```json
{ "id": 16682834177,
  "estoque": { "saldoVirtualTotal": 5 },
  "variacao": { "nome": "Tamanho:P", "ordem": 1, "produtoPai": { "id": 16682830009 } } }
```

- `variacao.nome` vem como `Atributo:Valor`. Com dois atributos vira
  `Tamanho:P;Cor:Azul` — nesse caso o código preserva o texto inteiro.

Para reinspecionar: `POST /api/erp/bling/sync-catalog?inspect=1` (somente
leitura, não escreve nada). **Remover esse modo quando a frente terminar.**

---

## 2. Como operar

### Build local

```bash
export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)
npm run build
```

O `export` é necessário porque `.env.production.local` contém `[SENSITIVE]` em
todos os valores (é um arquivo gerado por `vercel env pull`, e variáveis
marcadas como *Sensitive* não são legíveis). Sem isso, `neon()` estoura no
import. Com a URL real, o build ainda **prerenderiza contra o banco de
produção** — verificação mais forte.

### Disparar o sync

```bash
KEY=$(grep '^INTERNAL_API_KEY=' .env.local | cut -d= -f2-)
curl -X POST https://www.lyvest.com.br/api/erp/bling/sync-catalog -H "Authorization: Bearer $KEY"
```

### Verificar o banco

`.env.local` tem `DATABASE_URL` válida. Consultar com `@neondatabase/serverless`.

### Testar SQL sem sujar o banco

Bloco `DO $$ ... RAISE EXCEPTION 'RESULTADO|...' $$` — a transação inteira é
desfeita e o resultado viaja na mensagem do erro.

---

## 3. Credenciais — o que é acessível e o que não é

| Item | Situação |
|---|---|
| `DATABASE_URL` | em `.env.local`, válida |
| `INTERNAL_API_KEY` | em `.env.local`, gerada em 27/07 |
| `BLING_CLIENT_ID/SECRET` | **só na Vercel**, marcadas Sensitive. O secret **não é recuperável** no painel do Bling — só "Redefinir". Por isso o sync roda **em produção**, nunca local. |
| Domínios bloqueados p/ navegação automatizada | `vercel.com`, `bling.com.br`, `lyvest.com.br`, `console.neon.tech`. `dashboard.clerk.com` funciona. |

**Variável da Vercel só entra em vigor no deploy.** Trocar senha exige:
resetar → atualizar variável → **redeploy**. Pular o terceiro passo derruba o
banco em produção sem aviso (aconteceu em 26/07).

⚠️ `vercel env rm NOME production` remove a variável de **todos** os ambientes
quando ela é compartilhada. Recriar em cada um depois.

---

## 4. Pendências que dependem do dono

1. **5 produtos de teste públicos** na loja (`TESTE - Sutiã Renda Comfort` e os
   4 clones, estes últimos serão desativados pelo próximo sync). Decidir se
   apaga ou mantém.
2. **Produto sem categoria no Bling** → o mapeamento categoria→produto segue
   **sem teste**. Basta atribuir uma categoria e ressincronizar.
3. **Produto sem imagem** → `og:image` vazio, teste de SEO pela metade.

---

## 5. Dívida conhecida, não endereçada

- `FavoritesSection` migrou para o catálogo real, mas **`DrawerTracking` não tem
  rastreio de verdade**: `orders` não tem coluna de código de rastreio e não há
  integração com transportadora. Hoje responde honestamente que não encontrou.
- **Complexidade**: `create-session` (29) e `CheckoutPayment` (24). São
  orquestração real, não lógica extraível — refatorar exige teste de integração
  do checkout, que não existe.
- **Sem RLS**: a segurança é 100% aplicacional. Toda rota nova que toque dado de
  usuário PRECISA de `WHERE user_id = <clerk id>`. `docs/SECURITY_RLS.md` está
  desatualizado (descreve o Supabase).
- `syncCatalog` só grava `slug` no INSERT — renomear no Bling **não** atualiza a
  URL. É proposital (preserva links indexados), mas é uma escolha, não um
  descuido.

---

## 6. Lições que mudaram o modo de trabalhar

**Relatório verde não é verificação.** O sync reportou corretamente "4 variantes
criadas" e a conclusão ainda assim seria errada — os 4 clones antigos continuavam
na vitrine. Só olhar o banco revelou.

**Quase todo bug sério apareceu quando houve dado real.** Com o catálogo vazio,
nada indicava o canonical apontando para preview, o rastreio que inventava
entrega, ou os favoritos que nunca funcionaram. Esperar bugs novos quando o
catálogo de verdade entrar.

**`ON CONFLICT DO NOTHING` não é o mesmo que inofensivo.** `apply-neon.mjs`
reinseriu o catálogo de exemplo em produção porque o seed estava no caminho
padrão. Hoje exige `SEED=1`.

**Migração e povoamento são operações diferentes** e não devem dividir o mesmo
comando.
