# ✅ Checklist de Aceite — Security Gate

Valide **cada** item aplicável antes de entregar código. Marque `PASS` / `FAIL` / `N/A`
(com justificativa para `N/A`). Qualquer `FAIL` bloqueia a entrega.

## Pilar 1 — Zero-Trust Front-End (lógica de negócio)
- [ ] O client envia **apenas** IDs e quantidades — nunca preços, totais ou descontos confiáveis.
- [ ] Preço unitário é **relido do banco** (fonte da verdade) no servidor a cada transação.
- [ ] Desconto/cupom é **revalidado e reaplicado no servidor** no momento do pagamento.
- [ ] Frete é calculado a partir de dados do servidor/produto, não de valores do cliente.
- [ ] Quantidade é validada como inteiro positivo e conferida contra o estoque real.
- [ ] Total final é **recomputado** no servidor; o total do cliente é ignorado/só exibição.

## Pilar 2 — Race conditions (concorrência)
- [ ] Decremento de estoque é **atômico** e condicional (`WHERE stock >= n`) ou via RPC/transação.
- [ ] Cupom de uso único é garantido por **constraint/transação**, não por leitura-depois-escrita.
- [ ] Operações de pagamento/pedido têm **chave de idempotência** (evento repetido = 1 efeito).
- [ ] Webhooks são **idempotentes** (dedupe por ID do evento).
- [ ] Nenhuma decisão crítica depende de "checar e depois agir" sem lock/atomicidade.

## Pilar 3 — Controle de acesso (BOLA / IDOR)
- [ ] Toda rota sensível identifica o usuário logado no **servidor** (`auth()`/`currentUser()`).
- [ ] Toda leitura/escrita de recurso de usuário é **escopada pelo ID do logado** (não por parâmetro).
- [ ] RLS habilitada nas tabelas de usuário (`orders`, `addresses`, `favorites`, `profiles`, `reviews`).
- [ ] Funções serverless (`api/*.js`) fazem **sua própria** checagem de auth (o middleware não as cobre).
- [ ] `service_role`/chave que ignora RLS **nunca** é usada para leitura escopada por usuário.
- [ ] Autorização interna (webhooks/ERP) é **fail-closed** e usa comparação em tempo constante.

## Pilar 4 — Anti-bot com GEO/SEO (Cofre vs. Vitrine)
- [ ] Rate limiting escalonado aplicado nas rotas do **Cofre** (login, reset, checkout, POST/PUT).
- [ ] Rotas da **Vitrine** (GET de catálogo/conteúdo) **sem** rate limit agressivo — SEO/GEO preservados.
- [ ] Crawlers legítimos (Googlebot, OpenAIbot, etc.) não são bloqueados; scanners/automação maliciosa sim.
- [ ] Bloqueio por **comportamento/anomalia**, não bloqueio cego de IP.
- [ ] `robots.txt` permite catálogo e **bloqueia** rotas sensíveis (checkout, conta).
- [ ] Limite excedido retorna **429** (não vaza detalhe do controle).

## Pilar 5 — Injeção e PII
- [ ] Toda entrada de API é validada com **Zod** (`safeParse`) na fronteira.
- [ ] Queries usam o **query builder parametrizado** do Supabase — nunca SQL/NoSQL concatenado.
- [ ] Nenhuma PII (email, CPF, telefone, cartão, endereço) aparece em logs sem máscara.
- [ ] Respostas de erro **não** vazam `error.message`/stack/detalhes de infra em produção.
- [ ] Segredos só em env server-side; **nunca** com prefixo `NEXT_PUBLIC_`.
- [ ] Sentry/observabilidade faz scrubbing de PII (`beforeSend`, sem `email`/`ip`).
- [ ] Retornos de API expõem só os campos necessários (sem over-fetching de PII).

## Portão de saída
- [ ] `npm run build`, `npm run lint`, `tsc --noEmit` limpos.
- [ ] Testes (`npm run test:unit`) passam.
- [ ] Skill `security-review` rodada sobre o diff, sem achados de alta severidade abertos.
