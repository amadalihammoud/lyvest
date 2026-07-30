# Deploy — hardening LyVest

Código de segurança + PIX on-site + **OrderService** está na **main**.

## 1. Migrações Neon (obrigatório)

1. `db/neon/0008_create_order_shipping.sql`  
2. `db/neon/0009_order_coupon_and_expire.sql`  
3. `db/neon/0010_erp_order_id.sql`  

## 2. Variáveis de ambiente (Vercel)

| Variável | Uso |
|---|---|
| `PAYMENT_PROVIDER=asaas` | Servidor (gateway real) |
| **`NEXT_PUBLIC_PAYMENT_PROVIDER=asaas`** | Cliente (UI PIX on-site / mensagens) |
| `ASAAS_API_KEY` / `ASAAS_WEBHOOK_TOKEN` | Pagamento + webhook |
| `ASAAS_BASE_URL` | Sandbox ou produção |
| `UPSTASH_REDIS_*` | Rate limit + idempotência |
| `INTERNAL_API_KEY` | Cron / rotas internas |
| `ERP_PROVIDER` | `mock` ou `bling` |
| `PENDING_ORDER_TTL_HOURS` | Default 2 |
| `ERP_STOCK_AUTHORITATIVE` | Preferir `0` até confiar no webhook |

## 3. Testes mínimos

1. PIX — QR na loja, e-mail válido, webhook → `processing`  
2. Cartão — redirect Asaas  
3. Pending abandonado — cron restaura estoque  
4. Produção — sem form de cartão local  

## 4. Crons

- `*/30 * * * *` → `/api/internal/expire-pending-orders`  
- `15 * * * *` → `/api/internal/sync-erp-orders`  

## 5. Só o operador

- SQL no Neon  
- Secrets Vercel  
- OAuth Bling  
- Compra real de teste  
