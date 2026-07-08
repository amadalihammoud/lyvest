# Pilar 5 — Proteção e Sanitização Universal (injeção + PII)

## Validação na fronteira (Zod, sempre)
Toda entrada de API é validada com `safeParse` **antes** de qualquer uso. Nada de checar
só com `typeof`.

```ts
import { z } from 'zod';

const schema = z.object({
  code: z.string().min(1).max(32).regex(/^[A-Z0-9]+$/),
  cartTotal: z.number().nonnegative().optional(),
});

const parsed = schema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json({ error: 'Entrada inválida' }, { status: 400 });
}
```
Reuse os schemas do repo: `src/utils/schemas.ts` (`validateForm`, `addressSchema`,
`paymentSchema`) e validadores de `src/utils/validation.ts` (`isValidCPF`,
`isValidCreditCard`/Luhn, `sanitizeString`).

## Injeção (SQL/NoSQL) — independente do ORM
- Use **sempre** o query builder parametrizado (`.from().select().eq().in()` do Supabase).
- **Nunca** concatene entrada do usuário em SQL, filtros `.or()` textuais, nomes de coluna
  ou chaves dinâmicas. Se precisar de SQL cru, use parâmetros/binds — nunca template string.
- XSS é injeção no navegador: sanitize saída renderizada (`src/utils/sanitize.ts` /
  `escapeHTML` em `src/utils/security.ts`); nunca use `dangerouslySetInnerHTML` com dado do usuário.

## PII — nunca vaze em logs nem em respostas
Dados sensíveis: email, CPF/documento, telefone, endereço, cartão, tokens.

- **Logs:** use `src/utils/logger.ts` (gated por ambiente). Ao logar algo com PII, mascare
  com `maskCPF`/`obfuscateSensitiveData` de `src/utils/validation.ts`. Não logue `req.body`
  inteiro nem `remoteAddress` cru.
- **Respostas de erro:** em produção, **nunca** retorne `error.message`, stack ou detalhes
  de infra ao cliente. Padrão:

```js
return res.status(500).json({
  error: 'Erro interno',
  details: process.env.NODE_ENV === 'development' ? error.message : undefined,
});
```

- **Over-fetching:** selecione só os campos necessários; não devolva a linha inteira do
  usuário quando o cliente precisa de `id`/`nome`.
- **Segredos:** chaves de API/tokens só em env server-side. **Nunca** `NEXT_PUBLIC_*` para
  segredo (isso vai para o bundle do browser).

## Observabilidade sem PII (Sentry)
- `beforeSend` removendo `event.user.email` e `ip_address` (já feito em `src/utils/sentry.ts`).
- Session replay: cuidado com `maskAllText: false` — mascare texto sensível em telas de
  checkout/conta.

## Checklist
- [ ] `safeParse` em toda entrada de API.
- [ ] Zero concatenação de input em query; só builder/binds.
- [ ] PII mascarada em logs; `error.message` só em dev.
- [ ] Segredos sem `NEXT_PUBLIC_`.
- [ ] Respostas expõem só campos necessários.

## Como testar
- Envie payloads malformados/tipos errados → 400 do Zod, sem 500.
- Force um erro em produção simulada (`NODE_ENV=production`) → resposta sem `message`/stack.
- `grep` no diff por `console.log(`/`console.error(` com PII e por `NEXT_PUBLIC_` em segredos.
