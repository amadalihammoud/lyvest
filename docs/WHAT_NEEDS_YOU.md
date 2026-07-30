# O que ainda depende de você

Este arquivo lista o que **não** pode ser feito só com commit no GitHub.

## Obrigatório para produção segura

1. **Neon** — aplicar `0008`, `0009`, `0010` (ver `docs/SECURITY_DEPLOY.md`)
2. **Vercel env**
   - `PAYMENT_PROVIDER=asaas`
   - `NEXT_PUBLIC_PAYMENT_PROVIDER=asaas`
   - `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`
   - `UPSTASH_REDIS_*`, `INTERNAL_API_KEY`
3. **Redeploy** da `main`
4. **Webhook Asaas** → `https://<seu-dominio>/api/payment/webhook`
5. **1 compra PIX + 1 cartão** de teste

## Opcional

- `ERP_PROVIDER=bling` + OAuth Bling + `BLING_LOJA_ID`
- Chave Pix na conta Asaas
- Pedido de tokenização ao Asaas (cartão no site)
- Frete real (API transportadora) — ainda mock no código

## Já está no código (não precisa de ticket)

- OrderService (paid / refund / expire)
- PIX on-site + e-mail guest
- Frete no total do pedido (SQL 0008)
- Webhook com conferência de valor
- Reviews endurecidos, CSP, form cartão off em prod
