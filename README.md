# Ly Vest - E-commerce

E-commerce moderno, construído com Next.js 16 (App Router) e React 19.

![Ly Vest](public/lyvest-red-logo.png)

## Funcionalidades

- **Carrinho de Compras** - Estado global com Zustand e persistência em localStorage
- **Lista de Favoritos** - Com limite de itens
- **Busca com Debounce** - Performance otimizada
- **Rastreamento de Pedidos** - Pronto para integração
- **Checkout Completo** - Endereço, pagamento (cartão/PIX), confirmação
- **Autenticação** - Clerk (`@clerk/nextjs`)
- **PWA** - Instalável como app nativo
- **i18n Ready** - Estrutura para internacionalização
- **Acessível** - Skip links, focus trap, ARIA labels

## Quick Start

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Next.js)
npm run dev

# Build de produção
npm run build

# Servir o build de produção
npm run start

# Verificar o código (lint)
npm run lint

# Testes unitários (Vitest)
npm run test

# Testes end-to-end (Playwright)
npm run test:e2e
```

## Estrutura do Projeto

```
src/
├── app/            # Rotas do App Router (páginas, layouts e route handlers em app/api)
├── components/     # Componentes React
├── config/         # Constantes e configurações
├── data/           # Dados estáticos e mock
├── hooks/          # Custom hooks
├── services/       # Serviços (Product, Payment, Shipping, etc.)
├── store/          # Stores Zustand (carrinho, favoritos, modal, i18n)
└── utils/          # Utilitários (validação, segurança, formatters, analytics)
```

## Stack Tecnológica

- **Next.js 16** (App Router) - Framework
- **React 19** - UI Library
- **TypeScript** - Tipagem
- **TailwindCSS 3** - Styling
- **Zustand** - Gerenciamento de estado
- **Zod** - Validação
- **Clerk** - Autenticação
- **Supabase** - Banco de dados
- **Upstash (Redis)** - Rate limiting e cache
- **AI SDK** - Recursos de IA
- **Lucide Icons** - Ícones
- **Vitest** + **Playwright** - Testes

## Segurança

- Validação com Zod
- Proteção XSS e sanitização de inputs
- Rate Limiting (Upstash)
- CSP Headers
- Honeypot anti-spam
- Validação de localStorage

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com as chaves necessárias para Clerk, Supabase, Upstash e demais integrações. Nunca commite segredos.

## Licença

Este projeto é privado e proprietário.
