# Deploy — hardening LyVest (fases 0–3)

Código das fases 0–3 está na **main** (PR #12 mergeado). Abaixo o que **só o operador** pode fazer.

## 1. Migrações Neon (obrigatório)

Aplicar nesta ordem:

1. `db/neon/0008_create_order_shipping.sql` — frete no total do pedido  
2. `db/neon/0009_order_coupon_and_expire.sql` — `coupon_code` + cancel autossuficiente  
3. `db/neon/0010_erp_order_id.sql` — correlação Bling  

Depois: redeploy na Vercel.

## 2. Variáveis de ambiente (Vercel)

| Variável | Uso |
|---|---|
| `PAYMENT_PROVIDER=asaas` | Checkout hospedado |
| `ASAAS_*` / `ASAAS_WEBHOOK_TOKEN` | Pagamento + webhook |
| `UPSTASH_REDIS_*` | Rate limit + idempotência |
| `INTERNAL_API_KEY` | Cron / rotas internas |
| `ERP_PROVIDER=bling` | Só após validar com mock |
| `BLING_CLIENT_ID` / `BLING_CLIENT_SECRET` | OAuth Bling |
| `BLING_LOJA_ID` | Opcional |
| `PENDING_ORDER_TTL_HOURS` | Default 2 |
| `ERP_STOCK_AUTHORITATIVE` | Manter `0` até confiar no webhook de estoque |

## 3. Testes manuais mínimos

1. **Checkout Asaas** — total no gateway = produtos + frete  
2. **Webhook** — `pending` → `processing`; valor divergente não marca pago  
3. **Pending abandonado** — TTL restaura estoque/cupom  
4. **Review** — productId UUID + pedido pago do user  
5. **Produção** — sem formulário de cartão no site  
6. **Bling** — venda com `numeroLoja` = UUID local  

## 4. Crons Vercel

- `*/30 * * * *` → `/api/internal/expire-pending-orders`  
- `15 * * * *` → `/api/internal/sync-erp-orders`  

## 5. O que o código não faz sozinho

- Aplicar SQL no Neon  
- Configurar secrets na Vercel  
- Autorizar OAuth do Bling (primeira vez)  
- Compra real de ponta a ponta  
- Rotação de tokens  
