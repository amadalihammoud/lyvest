import * as Sentry from '@sentry/react';

/**
 * Configuração do Sentry para Monitoramento de Erros
 * 
 * Captura erros em produção e envia relatórios detalhados
 * incluindo stack traces, contexto do usuário e breadcrumbs
 */

const isDevelopment = import.meta.env.DEV;
const sentryDSN = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production';

export function initSentry() {
    // Só inicializar em produção e se DSN estiver configurado
    if (isDevelopment || !sentryDSN) {
        console.log('[Sentry] Desabilitado em desenvolvimento');
        return;
    }

    Sentry.init({
        dsn: sentryDSN,
        environment,

        // Taxa de amostragem de traces de performance (10%)
        tracesSampleRate: 0.1,

        // Taxa de amostragem de replays de sessão (10% em erros)
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        integrations: [
            // Replay de sessão para ver o que o usuário fez antes do erro
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),

            // Tracking de browser
            Sentry.browserTracingIntegration(),

            // Feedback do usuário
            Sentry.feedbackIntegration({
                colorScheme: 'light',
                showBranding: false,
            }),
        ],

        // Ignorar erros conhecidos
        ignoreErrors: [
            // Erros do browser
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',

            // Erros de extensões
            'chrome-extension://',
            'moz-extension://',

            // Erros de rede comuns
            'NetworkError',
            'Failed to fetch',
        ],

        // Antes de enviar o erro, adicionar contexto adicional
        beforeSend(event, hint) {
            // Adicionar informações personalizadas
            if (event.user) {
                // Remover informações sensíveis
                delete event.user.email;
                delete event.user.ip_address;
            }

            return event;
        },
    });

    console.log('[Sentry] Inicializado com sucesso');
}

/**
 * Capturar erro manualmente
 */
export function captureError(error: Error, context?: Record<string, any>) {
    if (isDevelopment) {
        console.error('[Sentry Dev]', error, context);
        return;
    }

    Sentry.captureException(error, {
        extra: context,
    });
}

/**
 * Adicionar breadcrumb (navegação do usuário)
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
        message,
        data,
        level: 'info',
    });
}

/**
 * Definir contexto do usuário
 */
export function setUserContext(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser({
        id: user.id,
        username: user.username,
        // Email é omitido por privacidade
    });
}

/**
 * Limpar contexto do usuário (logout)
 */
export function clearUserContext() {
    Sentry.setUser(null);
}

export default Sentry;
