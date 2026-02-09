
// src/utils/webVitals.ts

/**
 * Utilitário para monitorar Core Web Vitals
 * Integra com Google Analytics ou outros sistemas de analytics
 * 
 * Métricas monitoradas:
 * - LCP (Largest Contentful Paint): performance de carregamento
 * - FID (First Input Delay): interatividade
 * - CLS (Cumulative Layout Shift): estabilidade visual
 * - FCP (First Contentful Paint): primeira renderização
 * - TTFB (Time to First Byte): resposta do servidor
 */

export interface Metric {
    name: string;
    value: number;
    delta: number;
    id: string;
    navigationType?: string;
    rating: 'good' | 'needs-improvement' | 'poor';
    entries?: any[];
}

declare global {
    interface Window {
        gtag?: (command: string, category: string, params?: Record<string, any>) => void;
    }
}

/**
 * Reporta uma métrica vital para o sistema de analytics
 * @param metric - Objeto da métrica web vitals
 */
function sendToAnalytics(metric: Metric) {
    const analyticsData = {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    };

    // Se Google Analytics 4 estiver configurado
    if (typeof window.gtag === 'function') {
        window.gtag('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            non_interaction: true,
        });
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        const colors = {
            good: '#0cce6b',
            'needs-improvement': '#ffa400',
            poor: '#ff4e42',
        };
        console.log(
            `%c[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
            `color: ${colors[metric.rating] || '#888'}`
        );
    }

    // Beacon API para envio confiável mesmo ao sair da página
    if (navigator.sendBeacon && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        navigator.sendBeacon(
            process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
            JSON.stringify(analyticsData)
        );
    }
}

/**
 * Inicializa o monitoramento de Web Vitals
 * Importa dinamicamente a biblioteca para não impactar o bundle inicial
 */
export async function initWebVitals(): Promise<void> {
    try {
        // Importação dinâmica para não afetar o bundle principal
        const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

        // Registra callbacks para cada métrica
        onCLS(sendToAnalytics);
        onFCP(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        onINP(sendToAnalytics); // Interaction to Next Paint (substitui FID)

        if (process.env.NODE_ENV === 'development') {
            console.info('Web Vitals Monitoramento iniciado');
        }
    } catch {
        // Biblioteca não instalada - falha silenciosa
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Web Vitals] Biblioteca não encontrada. Instale com: npm install web-vitals');
        }
    }
}

/**
 * Thresholds oficiais do Google para as métricas
 * Use para criar indicadores visuais ou alertas
 */
export const WEB_VITALS_THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },      // ms
    FID: { good: 100, poor: 300 },        // ms
    CLS: { good: 0.1, poor: 0.25 },       // score
    FCP: { good: 1800, poor: 3000 },      // ms
    TTFB: { good: 800, poor: 1800 },      // ms
    INP: { good: 200, poor: 500 },        // ms
} as const;

/**
 * Avalia a qualidade de uma métrica
 * @param name - Nome da métrica (LCP, FID, CLS, etc)
 * @param value - Valor medido
 * @returns 'good' | 'needs-improvement' | 'poor'
 */
export function getRating(name: keyof typeof WEB_VITALS_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = WEB_VITALS_THRESHOLDS[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}
