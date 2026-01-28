// src/hooks/useDebounce.ts
import { useState, useEffect, useRef } from 'react';

/**
 * Hook de debounce para otimizar inputs de busca e outros campos
 * Evita re-renders e requisições excessivas
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook de debounce para callbacks/funções
 * Útil para handlers de eventos que não devem ser chamados frequentemente
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(callback: T, delay: number = 300): (...args: Parameters<T>) => void {
    const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

    const debouncedCallback = (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimeoutId(newTimeoutId);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return debouncedCallback;
}

/**
 * Hook de throttle - garante que a função seja chamada no máximo uma vez por período
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastRan = useRef<number>(0);
    const isFirstRun = useRef<boolean>(true);

    useEffect(() => {
        // Skip initial render - just track the time
        if (isFirstRun.current) {
            isFirstRun.current = false;
            lastRan.current = Date.now();
            return;
        }

        const now = Date.now();
        const timeSinceLastRan = now - lastRan.current;

        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, Math.max(0, limit - timeSinceLastRan));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
}
