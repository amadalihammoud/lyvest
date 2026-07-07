# Pilar 4 — Anti-Bot com preservação de GEO/SEO ("Cofre vs. Vitrine")

## O princípio
Nem toda automação é inimiga. Dividimos as rotas em duas classes:

- **🏦 Cofre (proteger):** rotas transacionais/sensíveis — `login`, `reset de senha`,
  `checkout`, `criação de pagamento`, `validação de cupom`, qualquer `POST/PUT/DELETE`.
  Aqui aplicamos rate limiting escalonado e detecção de anomalia.
- **🪟 Vitrine (abrir):** rotas públicas de catálogo/conteúdo — `GET` de produtos,
  categorias, páginas. Ficam **abertas e rápidas** para serem indexadas por crawlers de IA
  e buscadores (OpenAIbot, Googlebot, PerplexityBot, etc.). Rate limiting agressivo aqui
  **destrói SEO/GEO** — não faça.

## Rate limiting escalonado (Upstash, já instalado)

Use o helper `src/lib/rate-limit.ts` (sobre `src/services/redis.ts` + `@upstash/ratelimit`).
Limites por sensibilidade da rota:

| Rota (Cofre) | Sugestão de limite |
|---|---|
| login / reset de senha | 5 / 5 min por IP |
| checkout / criação de pagamento | 10 / min por IP+usuário |
| validação de cupom | 20 / min |
| formulários (newsletter, contato) | 10 / min |

```ts
import { checkRateLimit } from '@/lib/rate-limit';

const rl = await checkRateLimit(request, 'checkout'); // sliding window
if (!rl.success) {
  return NextResponse.json({ error: 'Muitas requisições' }, { status: 429 });
}
```

**Nunca** envolva rotas GET de catálogo nesse limite.

## Anti-bot por comportamento (não por bloqueio cego de IP)
Alvos a barrar: **card testing**, **credential stuffing**, **vulnerability scanners**.
Sinais comportamentais: rajadas anormais na mesma rota sensível, muitos cartões/cupons
diferentes por sessão, UA de ferramenta (`curl`, `python`, `headless`, `sqlmap`), ausência
de fluxo humano (sem GET de página antes do POST).

- `src/utils/security.ts` já traz `detectBot(userAgent)` e `createHoneypot()`.
- **Honeypot** em formulários: campo oculto que humanos não preenchem; se vier preenchido,
  descarte silenciosamente.
- Preserve crawlers legítimos: `detectBot` casa `curl/python/headless` (ruins) mas **não**
  deve bloquear Googlebot/OpenAIbot em rotas de Vitrine — a decisão de bloquear é só no Cofre.

## SEO/GEO — não sabote a indexação
- `public/robots.txt`: `Allow: /` no catálogo, `Disallow` em `/checkout` e conta; inclua `Sitemap:`.
- Não sirva 429/403 para crawlers em rotas públicas.
- Headers de cache longo em assets estáticos (já configurado em `next.config.mjs`).

## Checklist
- [ ] Rate limit só no Cofre; Vitrine intacta.
- [ ] 429 no excesso, sem vazar internals.
- [ ] Detecção comportamental + honeypot em formulários sensíveis.
- [ ] `robots.txt` coerente (catálogo aberto, conta/checkout fechados).

## Como testar
- Rajada numa rota do Cofre → 429 após o limite. `curl` de UA `Googlebot` num GET de
  catálogo → 200 normal (sem limite).
