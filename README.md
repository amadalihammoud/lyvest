# 🎀 Ly Vest - E-commerce

E-commerce moderno, construído com React + Vite.

![Ly Vest](public/lyvest-red-logo.png)

## ✨ Funcionalidades

- 🛒 **Carrinho de Compras** - Persistência em localStorage
- ❤️ **Lista de Favoritos** - Com limite de 100 itens
- 🔍 **Busca com Debounce** - Performance otimizada
- 📦 **Rastreamento de Pedidos** - Simulação pronta para integração
- 💳 **Checkout Completo** - Endereço, pagamento (cartão/PIX), confirmação
- 📱 **PWA** - Instalável como app nativo
- 🌐 **i18n Ready** - Estrutura para internacionalização
- ♿ **Acessível** - Skip links, focus trap, ARIA labels

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Executar testes
npm run test
```

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes React
├── config/         # Constantes e configurações
├── context/        # React Contexts (Cart, Favorites, Modal, i18n)
├── data/           # Dados estáticos e mock
├── hooks/          # Custom hooks
├── layouts/        # Layout principal
├── pages/          # Páginas (Home, Product, Checkout, Dashboard)
├── services/       # Serviços (API, Payment, Shipping)
└── utils/          # Utilitários (validation, security, formatters, analytics)
```

## 🔒 Segurança

- ✅ Validação com Zod
- ✅ Proteção XSS
- ✅ Rate Limiting
- ✅ CSP Headers
- ✅ Honeypot anti-spam
- ✅ Sanitização de inputs
- ✅ Validação de localStorage

## 🔌 Integrações Preparadas

O projeto está pronto para integração com:

### Gateways de Pagamento
- Stripe
- PagSeguro
- Mercado Pago

### Transportadoras
- Correios
- Jadlog
- Melhor Envio

### Analytics
- Google Analytics 4
- Plausible

### Monitoramento de Erros
- Sentry
- LogRocket

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# API
VITE_API_URL=/api

# Analytics
VITE_ANALYTICS_ENABLED=true
VITE_GA_ID=G-XXXXXXXXXX

# Pagamento (configurar após integração)
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
```

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Com coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run test` | Executar testes |
| `npm run lint` | Verificar código |

## 🎨 Stack Tecnológica

- **React 18** - UI Library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navegação
- **Zod** - Validação
- **Lucide Icons** - Ícones
- **Vitest** - Testes

## 📱 Transformando em App Nativo (Android/iOS)
Este projeto é um PWA, mas pode ser publicado nas lojas (Google Play e App Store) usando o **Capacitor**.

### Passos para criar o App Nativo:

1. **Instalar Dependências Mobile**
```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init
```

2. **Instalar Plataformas**
```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

3. **Gerar Build e Sincronizar**
```bash
npm run build
npx cap sync
```

4. **Abrir no Android Studio / Xcode**
```bash
npx cap open android
# ou
npx cap open ios
```

Depois disso, basta gerar o `.apk` (Android) ou `.ipa` (iOS) através das IDEs nativas e submeter para as lojas.

## 📄 Licença

Este projeto é privado e proprietário.

---

Feito com 💖 para Ly Vest
