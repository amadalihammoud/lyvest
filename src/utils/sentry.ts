/**
 * Configuração do Sentry para Monitoramento de Erros (Lazy Loaded)
 */
import { logger } from './logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production';

// Placeholder for the Sentry instance
let SentryInstance: typeof import('@sentry/react') | null = null;

/**
 * Carrega o SDK do Sentry de forma assíncrona
 */
async function loadSentry() {
    if (SentryInstance) return SentryInstance;

    // Import dinâmico — tira o Sentry do bundle principal
    const Sentry = await import('@sentry/react');
    SentryInstance = Sentry;
    return Sentry;
}

export async function initSentry() {
    if (isDevelopment || !sentryDSN) {
        logger.info('[Sentry] Desabilitado em desenvolvimento');
        return;
    }

    try {
        const Sentry = await loadSentry();

        Sentry.init({
            dsn: sentryDSN,
            environment,
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            integrations: [
                Sentry.replayIntegration({
                    // PII: a loja coleta endereço, nome e (no checkout) dados de cartão.
                    // Mascarar todo texto e mídia evita que o Session Replay capture esses
                    // dados na tela do usuário.
                    maskAllText: true,
                    blockAllMedia: true,
                }),
                Sentry.browserTracingIntegration(),
                Sentry.feedbackIntegration({
                    colorScheme: 'light',
                    showBranding: false,
                }),
            ],
            ignoreErrors: [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
                'chrome-extension://',
                'moz-extension://',
                'NetworkError',
                'Failed to fetch',
            ],
            beforeSend(event) {
                if (event.user) {
                    delete event.user.email;
                    delete event.user.ip_address;
                }
                return event;
            },
        });

        logger.info('[Sentry] Inicializado com sucesso (Lazy)');
    } catch (err) {
        console.error('[Sentry] Falha ao inicializar:', err);
    }
}

/**
 * Capturar erro manualmente
 */
export async function captureError(error: Error, context?: Record<string, unknown>) {
    if (isDevelopment) {
        console.error('[Sentry Dev]', error, context);
        return;
    }

    try {
        const Sentry = await loadSentry();
        Sentry.captureException(error, {
            extra: context,
        });
    } catch {
        console.error('Falha ao reportar erro ao Sentry:', error);
    }
}

/**
 * Adicionar breadcrumb (navegação do usuário)
 */
export async function addBreadcrumb(message: string, data?: Record<string, unknown>) {
    try {
        const Sentry = await loadSentry();
        Sentry.addBreadcrumb({
            message,
            data,
            level: 'info',
        });
    } catch {
        // Silently fail for breadcrumbs
    }
}

/**
 * Definir contexto do usuário
 */
export async function setUserContext(user: { id: string; email?: string; username?: string }) {
    try {
        const Sentry = await loadSentry();
        Sentry.setUser({
            id: user.id,
            username: user.username,
        });
    } catch {
        // Fail silently
    }
}

/**
 * Limpar contexto do usuário (logout)
 */
export async function clearUserContext() {
    try {
        const Sentry = await loadSentry();
        Sentry.setUser(null);
    } catch {
        // Fail silently
    }
}

// Export default as null or a proxy if needed, but better to use named exports
export default null;
