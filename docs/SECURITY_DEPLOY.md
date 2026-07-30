# Deploy — hardening LyVest (fases 0–3)

Checklist do que **só o operador** pode fazer (código já está no PR #12 / branch `fix/security-phase-3-erp`).

## 1. Merge e migrações Neon

1. Mergear o PR que empilha as fases (recomendado: **#12**).
2. Aplicar no Neon, nesta ordem:
   - `db/neon/0008_create_order_shipping.sql`
   - `db/neon/0009_order_coupon_and_expire.sql`
   - `db/neon/0010_erp_order_id.sql`
3. Redeploy na Vercel.

## 2. Variáveis de ambiente (Vercel)

| Variável | Uso |
|---|---|
| `PAYMENT_PROVIDER=asaas` | Checkout hospedado |
| `ASAAS_*` / `ASAAS_WEBHOOK_TOKEN` | Pagamento + webhook |
| `UPSTASH_REDIS_*` | Rate limit + idempotência (não fail-open em prod) |
| `INTERNAL_API_KEY` | Cron / rotas internas |
| `ERP_PROVIDER=bling` | Só após validar mock |
| `BLING_CLIENT_ID` / `BLING_CLIENT_SECRET` | OAuth Bling |
| `BLING_LOJA_ID` | Opcional |
| `PENDING_ORDER_TTL_HOURS` | Default 2 |
| `ERP_STOCK_AUTHORITATIVE` | Manter `0` até confiar no webhook de estoque |

## 3. Testes manuais mínimos

1. **Checkout Asaas** — total no gateway = produtos + frete.
2. **Webhook** — pedido `pending` → `processing`; valor divergente não marca pago.
3. **Pending abandonado** — após TTL, estoque e cupom voltam (`/api/internal/expire-pending-orders`).
4. **Review** — exige productId UUID + pedido pago do user.
5. **Produção** — formulário de cartão **não** aparece no site.
6. **Bling** (com `ERP_PROVIDER=bling`) — pedido pago cria venda com `numeroLoja` = UUID local.

## 4. Crons Vercel

- `*/30 * * * *` → `/api/internal/expire-pending-orders`
- `15 * * * *` → `/api/internal/sync-erp-orders`

Plano Hobby pode limitar frequência de cron.

## 5. O que o código **não** faz sozinho

- Aplicar SQL no Neon
- Configurar secrets na Vercel
- Autorizar OAuth do Bling (primeira vez)
- Compra real de ponta a ponta
- Rotação de tokens comprometidos
