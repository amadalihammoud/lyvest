# 🔒 Checklist de Segurança - Ly Vest

Este documento contém verificações de segurança que devem ser realizadas antes de cada deploy em produção.

---

## ✅ Pré-Deploy Checklist

### 1. Variáveis de Ambiente
- [ ] Nenhuma chave de API exposta no código-fonte
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_ANON_KEY` configurado
- [ ] `OPENAI_API_KEY` configurado apenas no servidor (não expor no cliente)
- [ ] Verificar que `.env.local` está no `.gitignore`

### 2. Headers de Segurança
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Content-Security-Policy` configurado
- [ ] `Strict-Transport-Security` (HSTS) habilitado
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` restritivo

### 3. Autenticação
- [ ] Senhas com requisitos mínimos (8+ caracteres)
- [ ] Rate limiting em tentativas de login
- [ ] Tokens de sessão com expiração adequada
- [ ] Logout limpa todos os tokens
- [ ] OAuth2 com PKCE habilitado

### 4. Inputs e Formulários
- [ ] Validação client-side e server-side
- [ ] Sanitização de inputs HTML (DOMPurify)
- [ ] Proteção contra SQL Injection (Supabase RLS)
- [ ] Proteção contra XSS
- [ ] CSRF tokens em formulários críticos

### 5. APIs e Dados
- [ ] Row Level Security (RLS) habilitado no Supabase
- [ ] Endpoints sensíveis autenticados
- [ ] Rate limiting em APIs
- [ ] Nenhum dado sensível em logs
- [ ] Dados de pagamento não armazenados localmente

### 6. Dependências
- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] Dependências atualizadas
- [ ] Verificar licenças das dependências

---

## 🔍 Verificações Manuais

```bash
# 1. Verificar vulnerabilidades de dependências
npm audit

# 2. Verificar se há segredos no código
git log --all --full-history -- "*.env*"

# 3. Verificar headers de segurança (após deploy)
curl -I https://lyvest.com.br

# 4. Verificar CSP
curl -s https://lyvest.com.br | grep "Content-Security-Policy"
```

---

## 🚨 Em Caso de Incidente

### 1. Vazamento de Credenciais
1. Revogar imediatamente as credenciais vazadas
2. Gerar novas credenciais
3. Atualizar variáveis de ambiente
4. Verificar logs de acesso
5. Notificar usuários afetados (se aplicável)

### 2. Brecha de Segurança
1. Isolar o sistema afetado
2. Documentar o incidente
3. Aplicar patches
4. Conduzir análise post-mortem
5. Atualizar este checklist

---

## 📋 Headers Configurados (vercel.json)

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `Content-Security-Policy` | (configurado) | Previne XSS e injeções |
| `X-XSS-Protection` | `1; mode=block` | Proteção XSS legada |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controle de referrer |
| `Permissions-Policy` | (restritivo) | Desabilita APIs sensíveis |
| `Strict-Transport-Security` | `max-age=31536000...` | Força HTTPS |

---

## 🔐 Supabase RLS Policies

Verificar que as seguintes políticas estão ativas:

| Tabela | Policy | Descrição |
|--------|--------|-----------|
| `users` | `select` | Usuário pode ver apenas seus dados |
| `orders` | `select` | Usuário pode ver apenas seus pedidos |
| `addresses` | `all` | CRUD apenas para próprio usuário |
| `products` | `select` | Público para leitura |

---

## 📊 Monitoramento

- [ ] Sentry configurado para captura de erros
- [ ] Vercel Analytics ativo
- [ ] Alertas de erros críticos configurados
- [ ] Logs de autenticação habilitados

---

## 🔄 Revisão Periódica

- **Semanal**: `npm audit`, verificar logs de acesso
- **Mensal**: Revisar permissões Supabase, atualizar dependências
- **Trimestral**: Pentest simplificado, revisar CSP

---

*Última revisão: 01/02/2026*
*Próxima revisão: 01/03/2026*
