# Política de Segurança

## Relatar uma Vulnerabilidade

Levamos a segurança do nosso e-commerce muito a sério. Se você descobrir uma vulnerabilidade, agradecemos que nos informe imediatamente.

**Email**: security@lyvest.com.br

### O que incluir no relatório:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestão de correção (opcional)

### Nosso Compromisso:
| Ação | Prazo |
|------|-------|
| Leitura do relatório | 24 horas |
| Avaliação inicial | 72 horas |
| Correção (crítico) | 7 dias |
| Correção (alto) | 14 dias |
| Correção (médio/baixo) | 30 dias |

---

## Medidas de Segurança Implementadas

### Headers HTTP
- ✅ Content-Security-Policy (CSP)
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy

### Proteções Ativas
- ✅ Rate limiting (100 req/min por IP em rotas API)
- ✅ Detecção e bloqueio de bots maliciosos
- ✅ Proteção CSRF em mutações
- ✅ Sanitização de inputs com DOMPurify
- ✅ Validação de dados com Zod

### Dependências
- `npm audit` executado regularmente
- Atualizações automáticas via Dependabot

---

## Boas Práticas para Contribuidores

1. **Nunca commite secrets** - Use variáveis de ambiente
2. **Valide todos os inputs** - Use schemas Zod
3. **Sanitize outputs** - Use DOMPurify para conteúdo do usuário
4. **Mantenha dependências atualizadas** - Execute `npm audit` regularmente
5. **Revise o código** - Todos os PRs requerem revisão de segurança

---

Obrigado por ajudar a manter o Ly Vest seguro! 🔒
