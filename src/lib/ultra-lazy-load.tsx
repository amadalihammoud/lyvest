import { useState, useEffect, ComponentType, ReactNode } from 'react';

/**
 * Hook para detectar quando carregar scripts pesados
 * Aguarda LCP ou interação do usuário
 */
export function useUltraLazyLoad() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        let loaded = false;
        let lcpObserver: PerformanceObserver | null = null;
        let timer: NodeJS.Timeout | null = null;

        const loadScripts = () => {
            if (loaded) return;
            loaded = true;
            setShouldLoad(true);
            cleanup();
        };

        // Detectar LCP completo
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];

                    if (lastEntry && lastEntry.startTime) {
                        setTimeout(loadScripts, 500);
                    }
                });

                lcpObserver.observe({
                    type: 'largest-contentful-paint',
                    buffered: true
                });
            } catch (e) {
                console.warn('LCP observer failed:', e);
            }
        }

        // Interação do usuário
        const events = ['scroll', 'click', 'touchstart', 'mousemove', 'keydown'];
        events.forEach(event => {
            if (typeof window !== 'undefined') {
                window.addEventListener(event, loadScripts, { once: true, passive: true });
            }
        });

        // Fallback após 2s — Hero e InfoStrip agora são Server Components,
        // então o LCP ocorre bem antes. 2s é suficiente como backup.
        timer = setTimeout(loadScripts, 2000);

        function cleanup() {
            if (lcpObserver) lcpObserver.disconnect();
            if (timer) clearTimeout(timer);
            events.forEach(event => {
                if (typeof window !== 'undefined') {
                    window.removeEventListener(event, loadScripts);
                }
            });
        }

        return cleanup;
    }, []);

    return shouldLoad;
}

/**
 * Component Wrapper para lazy load de providers
 */
interface LazyProviderProps {
    children: ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: ComponentType<any>;
    [key: string]: any;
}

export function LazyProvider({ children, provider: Provider, ...props }: LazyProviderProps) {
    const [mounted, setMounted] = useState(false);
    const shouldLoad = useUltraLazyLoad();

    useEffect(() => {
        if (shouldLoad) {
            requestAnimationFrame(() => {
                setMounted(true);
            });
        }
    }, [shouldLoad]);

    if (!mounted) {
        return <>{ children } </>;
    }

    return <Provider { ...props } > { children } </Provider>;
}
