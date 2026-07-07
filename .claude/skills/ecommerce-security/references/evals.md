# Evals — Triggering & Cobertura

Cenários para medir se a skill (a) **dispara** nas situações certas e (b) **cobre** cada pilar.
Use como checklist de regressão ao editar a `description` ou os references.

## A. Triggering positivo (DEVE ativar)
A skill deve ser considerada ao atender qualquer destes pedidos:

| # | Pedido do usuário | Pilar(es) esperado(s) |
|---|---|---|
| P1 | "Cria o endpoint de finalizar o pedido / checkout" | 1, 2, 3, 5 |
| P2 | "Aplica o cupom e calcula o desconto" | 1, 2 |
| P3 | "Faz a rota que retorna os pedidos do usuário" | 3, 5 |
| P4 | "Adiciona validação de cupom / rota de pagamento" | 1, 2, 4, 5 |
| P5 | "Recebe o webhook do gateway de pagamento" | 1, 2, 5 |
| P6 | "Endpoint pra atualizar o endereço de entrega" | 3, 5 |
| P7 | "Faz login / reset de senha / rota de auth" | 3, 4 |
| P8 | "Cria uma API que grava no Supabase" | 3, 5 |
| P9 | "Decrementa o estoque quando vende" | 2 |
| P10 | "Upload de imagem/arquivo do usuário" | 5 |

## B. Triggering negativo (NÃO deve ativar)
Pedidos puramente de apresentação/Vitrine ou sem superfície sensível:

| # | Pedido do usuário | Por quê |
|---|---|---|
| N1 | "Ajusta o CSS do card de produto" | UI pura, sem dado sensível |
| N2 | "Cria a página estática de política de troca" | Conteúdo público (Vitrine) |
| N3 | "Adiciona animação no botão de adicionar ao carrinho" | UI pura |
| N4 | "Traduz os textos para inglês" | i18n, sem lógica sensível |
| N5 | "Otimiza a imagem hero da home" | Performance/estático |

> Observação: uma rota **GET de catálogo** (Vitrine) não deve puxar rate limiting (Pilar 4),
> mas a skill ainda pode ser consultada para confirmar que ela permanece aberta a crawlers.

## C. Casos de aceite por pilar (o código gerado DEVE passar)

- **Pilar 1:** POST com `price`/`amount`/`discount` no corpo → total cobrado usa preço do banco.
- **Pilar 2:** N compras concorrentes do último item → só 1 conclui; estoque nunca negativo.
- **Pilar 3:** usuário A tenta ler/editar recurso do usuário B → 401/404 (RLS + posse).
- **Pilar 4:** rajada em rota transacional → 429; GET de catálogo com UA Googlebot → 200.
- **Pilar 5:** payload malformado → 400 (Zod); erro em produção → sem `error.message`/PII.

## D. Como rodar
Este arquivo é um roteiro manual/LLM-eval. Para automação futura, transforme cada linha de C
em teste (Vitest para lógica pura; Playwright para fluxo). O teste `src/config/coupons.test.ts`
já cobre parte do Pilar 1 (recálculo de cupom na fonte única).
