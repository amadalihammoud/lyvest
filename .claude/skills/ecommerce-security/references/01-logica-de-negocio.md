# Pilar 1 — Zero-Trust Front-End (falhas lógicas de negócio)

## Regra de ouro
O client-side é **território hostil**. Preço, quantidade, desconto, cupom, frete, brindes
e status são **entrada não confiável**. A **fonte da verdade** é o backend/banco. Toda
transação é recalculada lá.

O que o client pode enviar: **identificadores** (id do produto, id do cupom, CEP) e
**quantidades**. Nada mais que tenha valor monetário.

## Padrão correto (referência no repo)

`api/payment/create-session.js` é o exemplo canônico — aceita só `id` + `quantity`, relê
o preço do banco e reconstrói os itens:

```js
// Só confiamos em IDs e quantidades do frontend
const paymentSchema = z.object({
  items: z.array(z.object({
    id: z.string().or(z.number()),
    quantity: z.number().int().positive(),
  })).min(1),
  currency: z.string().length(3).optional().default('BRL'),
});

// BUSCA OS PREÇOS REAIS NO BANCO (correção crítica de segurança)
const { data: dbProducts } = await supabase
  .from('products')
  .select('id, name, price, promotional_price')
  .in('id', productIds);

// Reconstrói itens com o preço do banco
const activePrice = dbProduct.promotional_price ?? dbProduct.price;
```

## Anti-padrões (o que NÃO fazer)

```js
// ❌ Confia no valor enviado pelo cliente — adulteração de preço trivial
const { amount, items } = req.body;
charge(amount);                          // cliente manda 0.01
items.map(i => ({ amount: i.price }));   // cliente manda price: 1
```

- **Desconto cosmético:** calcular desconto/cupom só no client e não reaplicar no servidor.
  O total precisa ser recomputado no backend **com** o desconto revalidado.
- **Regras duplicadas que divergem:** manter a tabela de cupons/preços no bundle do client
  e no servidor. Mantenha **uma** fonte da verdade (servidor); o client pergunta via API.

## Checklist de aplicação
1. Schema Zod aceita só `id` + `quantity` (e CEP/ids auxiliares).
2. Releia preço/promoção do banco por `id`.
3. Revalide o cupom no servidor e **reaplique** o desconto ao total do servidor.
4. Calcule frete a partir de dados do servidor.
5. Confira quantidade contra estoque real (ver Pilar 2 para atomicidade).
6. O `total` do cliente é usado **no máximo** para exibição — nunca para cobrança.

## Como testar
- POST com `price`/`amount`/`discount` "envenenados" no corpo → o valor cobrado deve ser
  o do banco, ignorando o do cliente.
- Cupom aplicado no client mas não enviado → o desconto **não** deve valer no pagamento
  a menos que o servidor o revalide.
