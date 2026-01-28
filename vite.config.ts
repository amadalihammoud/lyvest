/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],

  // Testes com Vitest
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
  },

  // Build otimizado para produção
  build: {
    // Segurança: Oculta código-fonte em produção
    sourcemap: false,

    // Compressão com terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: true,
      format: {
        comments: false, // Remove comentários
      }
    },

    // Code splitting otimizado
    rollupOptions: {
      output: {
        // Chunks nomeados para melhor cache
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

        // Separar vendors grandes
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          // React Router
          'vendor-router': ['react-router-dom'],
          // Lucide icons
          'vendor-icons': ['lucide-react'],
          // Validação
          'vendor-validation': ['zod'],
          // AI SDK (Heavy)
          'vendor-ai': ['ai', '@ai-sdk/react', '@ai-sdk/openai'],
          // Backend
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI Libs
          'vendor-ui': ['canvas-confetti', 'react-markdown'],
        }
      }
    },

    // Aumentar limite de warning de chunk
    chunkSizeWarningLimit: 500,

    // Target moderno para melhor otimização
    target: 'esnext',
  },

  // Otimização de dependências para evitar crash no OneDrive
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    force: true,
  },

  // Otimizações do servidor de desenvolvimento
  server: {
    // Desabilitar cache de FS para evitar bloqueios no OneDrive
    fs: {
      // cachedChecks removed as it is not a valid option in this version
    },
    // Headers de segurança em dev
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    }
  },

  // Preview com headers de segurança
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    }
  }
})
