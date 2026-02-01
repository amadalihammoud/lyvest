/**
 * Sistema de Métricas e Web Vitals
 * 
 * Coleta e reporta métricas de performance do frontend
 * Integra com Vercel Analytics e ferramentas customizadas
 */

import { webVitalsLogger } from './logger';

// Tipos para Web Vitals
interface Metric {
    id: string;
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    entries: PerformanceEntry[];
}

interface NavigationTiming {
    dnsLookup: number;
    tcpConnect: number;
    serverResponse: number;
    domLoad: number;
    pageLoad: number;
}

// Limiares para classificação de métricas
const WEB_VITALS_THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },    // Largest Contentful Paint
    FID: { good: 100, poor: 300 },       // First Input Delay
    CLS: { good: 0.1, poor: 0.25 },      // Cumulative Layout Shift
    FCP: { good: 1800, poor: 3000 },     // First Contentful Paint
    TTFB: { good: 800, poor: 1800 },     // Time to First Byte
    INP: { good: 200, poor: 500 },       // Interaction to Next Paint
};

/**
 * Classifica a qualidade de uma métrica
 */
function classifyMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

/**
 * Reporta Web Vitals para o console em desenvolvimento
 */
export function reportWebVitals(metric: Metric): void {
    const rating = classifyMetric(metric.name, metric.value);

    webVitalsLogger.info(
        `${metric.name}: ${metric.value.toFixed(2)} (${rating})`,
        { id: metric.id, delta: metric.delta }
    );

    // Enviar para Vercel Analytics (se disponível)
    if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('send', {
            name: metric.name,
            value: metric.value,
            rating: rating,
        });
    }
}

/**
 * Coleta métricas de navegação da Performance API
 */
export function getNavigationTiming(): NavigationTiming | null {
    if (typeof window === 'undefined' || !window.performance) return null;

    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!timing) return null;

    return {
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcpConnect: timing.connectEnd - timing.connectStart,
        serverResponse: timing.responseStart - timing.requestStart,
        domLoad: timing.domContentLoadedEventEnd - timing.startTime,
        pageLoad: timing.loadEventEnd - timing.startTime,
    };
}

/**
 * Coleta métricas de recursos (imagens, scripts, etc)
 */
export function getResourceMetrics(): { totalSize: number; count: number; slowestResource: string | null } {
    if (typeof window === 'undefined' || !window.performance) {
        return { totalSize: 0, count: 0, slowestResource: null };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    let totalSize = 0;
    let slowest: PerformanceResourceTiming | null = null;

    resources.forEach(resource => {
        totalSize += resource.transferSize || 0;

        if (!slowest || resource.duration > slowest.duration) {
            slowest = resource;
        }
    });

    return {
        totalSize,
        count: resources.length,
        slowestResource: slowest ? (slowest as PerformanceResourceTiming).name : null,
    };
}

/**
 * Mede tempo de uma operação
 */
export function measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    webVitalsLogger.debug(`${name} took ${duration.toFixed(2)}ms`);

    return result;
}

/**
 * Mede tempo de uma operação assíncrona
 */
export async function measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    webVitalsLogger.debug(`${name} took ${duration.toFixed(2)}ms`);

    return result;
}

/**
 * Cria um observer para Long Tasks (tarefas > 50ms)
 */
export function observeLongTasks(callback: (duration: number) => void): (() => void) | null {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return null;
    }

    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            callback(entry.duration);
            webVitalsLogger.warn(`Long Task detected: ${entry.duration.toFixed(2)}ms`);
        });
    });

    try {
        observer.observe({ entryTypes: ['longtask'] });
        return () => observer.disconnect();
    } catch {
        return null;
    }
}

/**
 * Métricas customizadas do e-commerce
 */
export const ecommerceMetrics = {
    /**
     * Mede tempo de carregamento da página de produto
     */
    productPageLoad: (productId: string, loadTime: number): void => {
        webVitalsLogger.info(`Product Page Load [${productId}]: ${loadTime.toFixed(2)}ms`);
    },

    /**
     * Mede tempo de adição ao carrinho
     */
    addToCartTime: (productId: string, duration: number): void => {
        webVitalsLogger.info(`Add to Cart [${productId}]: ${duration.toFixed(2)}ms`);
    },

    /**
     * Mede tempo de checkout
     */
    checkoutTime: (step: string, duration: number): void => {
        webVitalsLogger.info(`Checkout Step [${step}]: ${duration.toFixed(2)}ms`);
    },

    /**
     * Mede tempo de busca
     */
    searchTime: (query: string, resultsCount: number, duration: number): void => {
        webVitalsLogger.info(`Search "${query}": ${resultsCount} results in ${duration.toFixed(2)}ms`);
    },
};

export default {
    reportWebVitals,
    getNavigationTiming,
    getResourceMetrics,
    measureTime,
    measureTimeAsync,
    observeLongTasks,
    ecommerceMetrics,
};
