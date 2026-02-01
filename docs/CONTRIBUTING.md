# 🤝 Guia de Contribuição - Ly Vest

Obrigado por considerar contribuir com o Ly Vest! Este documento fornece diretrizes para contribuições.

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm 9+
- Git

### Setup
```bash
# Clonar repositório
git clone <repo-url>
cd ecommerce-ly-vest

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes React (TSX)
├── context/        # React Contexts
├── hooks/          # Custom Hooks
├── pages/          # Páginas/Rotas
├── services/       # Lógica de negócio
├── utils/          # Utilitários
└── data/           # Dados estáticos
```

---

## 🎯 Padrões de Código

### TypeScript
- **Obrigatório**: Todos novos arquivos devem ser `.tsx` ou `.ts`
- Usar interfaces para props de componentes
- Evitar `any`, preferir tipos específicos

### Componentes
```tsx
// ✅ Bom
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Nomenclatura
- **Componentes**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useCart.ts`)
- **Utilitários**: camelCase (`formatPrice.ts`)
- **Constantes**: UPPER_SNAKE_CASE

---

## 🔀 Workflow Git

### Branches
- `main` - Produção
- `develop` - Desenvolvimento
- `feature/*` - Novas features
- `fix/*` - Correções

### Commits
Seguir [Conventional Commits](https://conventionalcommits.org/):

```
feat: adiciona filtro de preço
fix: corrige erro no checkout
docs: atualiza README
style: formata código
refactor: refatora componente ProductCard
test: adiciona testes E2E
chore: atualiza dependências
```

### Pull Requests
1. Criar branch da `develop`
2. Fazer commits atômicos
3. Abrir PR descrevendo mudanças
4. Aguardar aprovação e CI passar
5. Merge via squash

---

## ✅ Checklist de PR

- [ ] Código segue padrões do projeto
- [ ] Testes passando (`npm run test`)
- [ ] Linter passando (`npm run lint`)
- [ ] Tipos corretos (`npx tsc --noEmit`)
- [ ] Sem console.logs
- [ ] Documentação atualizada (se necessário)

---

## 🧪 Testes

### Rodar Testes
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Com cobertura
npx vitest run --coverage
```

### Estrutura de Testes
```
src/
├── __tests__/              # Testes unitários
├── components/__tests__/   # Testes de componentes
└── hooks/__tests__/        # Testes de hooks

tests/
└── e2e/                    # Testes E2E (Playwright)
```

---

## 🎨 Estilos

- Usar **TailwindCSS** para estilização
- Classes utilitárias são preferidas
- Evitar CSS customizado quando possível
- Seguir o design system existente

### Cores do Brand
```css
--lyvest-500: #800020;  /* Bordô principal */
--lyvest-600: #600018;  /* Bordô escuro */
```

---

## 📝 Documentação

- Adicionar JSDoc para funções públicas
- Manter README atualizado
- Documentar APIs e hooks complexos

```typescript
/**
 * Hook para gerenciar carrinho de compras
 * @returns Métodos e estado do carrinho
 */
export function useCart() {
  // ...
}
```

---

## 🐛 Reportando Bugs

1. Verificar se já não foi reportado
2. Abrir issue com:
   - Descrição clara
   - Passos para reproduzir
   - Comportamento esperado
   - Screenshots (se aplicável)
   - Ambiente (browser, OS)

---

## 💡 Sugerindo Features

1. Abrir issue com label `enhancement`
2. Descrever o problema que resolve
3. Propor solução
4. Aguardar discussão

---

## 📞 Contato

- **Email**: dev@lyvest.com.br
- **Issues**: GitHub Issues

---

*Última atualização: 01/02/2026*
