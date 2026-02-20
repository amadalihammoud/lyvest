/**
 * Configuração do Sentry para Monitoramento de Erros (Lazy Loaded)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production';

// Placeholder for the Sentry instance
let SentryInstance: any = null;

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
        console.log('[Sentry] Desabilitado em desenvolvimento');
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
                    maskAllText: false,
                    blockAllMedia: false,
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
            beforeSend(event: any) {
                if (event.user) {
                    delete event.user.email;
                    delete event.user.ip_address;
                }
                return event;
            },
        });

        console.log('[Sentry] Inicializado com sucesso (Lazy)');
    } catch (err) {
        console.error('[Sentry] Falha ao inicializar:', err);
    }
}

/**
 * Capturar erro manualmente
 */
export async function captureError(error: Error, context?: Record<string, any>) {
    if (isDevelopment) {
        console.error('[Sentry Dev]', error, context);
        return;
    }

    try {
        const Sentry = await loadSentry();
        Sentry.captureException(error, {
            extra: context,
        });
    } catch (err) {
        console.error('Falha ao reportar erro ao Sentry:', error);
    }
}

/**
 * Adicionar breadcrumb (navegação do usuário)
 */
export async function addBreadcrumb(message: string, data?: Record<string, any>) {
    try {
        const Sentry = await loadSentry();
        Sentry.addBreadcrumb({
            message,
            data,
            level: 'info',
        });
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
        // Fail silently
    }
}

// Export default as null or a proxy if needed, but better to use named exports
export default null;
