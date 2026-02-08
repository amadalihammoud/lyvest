# Contribuindo para Ly Vest

Obrigado por considerar contribuir! 🎉

## 🚀 Como Começar

### Pré-requisitos
- Node.js 18+
- npm 9+

### Setup Local
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ecommerce-ly-vest.git
cd ecommerce-ly-vest

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📋 Padrões de Código

### Nomenclatura
| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase + use | `useAuth.ts` |
| Utils | camelCase | `formatters.ts` |
| Types | PascalCase | `ProductType.ts` |

### TypeScript
- ✅ Use tipos explícitos (evite `any`)
- ✅ Use interfaces para props de componentes
- ✅ Use Zod para validação de inputs

### Commits
Siga o padrão [Conventional Commits](https://conventionalcommits.org/):
```
feat: adiciona filtro de produtos
fix: corrige cálculo de frete
docs: atualiza README
```

## 🧪 Testes

```bash
# Testes unitários
npm run test:unit

# Testes E2E
npm run test:e2e

# Cobertura
npm run test -- --coverage
```

## 🔒 Segurança

Leia [SECURITY.md](./SECURITY.md) para políticas de segurança.

## 📝 Pull Requests

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Faça commits seguindo o padrão
4. Abra um Pull Request
5. Aguarde revisão

## 📄 Licença

Este projeto é propriedade de Ly Vest. Veja LICENSE para mais detalhes.
