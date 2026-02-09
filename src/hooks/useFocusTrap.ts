// src/hooks/useFocusTrap.ts
'use client';
import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook para prender o foco dentro de um elemento
 * Útil para modais, drawers e menus
 */
export function useFocusTrap(isActive: boolean = false): RefObject<HTMLDivElement | null> {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Salva o elemento que estava focado antes
        previousActiveElement.current = document.activeElement as HTMLElement;

        // Elementos focáveis dentro do container
        const getFocusableElements = (): HTMLElement[] => {
            if (!containerRef.current) return [];
            const elements = containerRef.current.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            return Array.from(elements) as HTMLElement[];
        };

        // Foca no primeiro elemento focável
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusable = getFocusableElements();
            if (focusable.length === 0) return;

            const firstElement = focusable[0];
            const lastElement = focusable[focusable.length - 1];

            // Shift + Tab: volta para o último elemento
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
            // Tab: vai para o primeiro elemento
            else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Restaura o foco ao elemento anterior quando o trap é desativado
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isActive]);

    return containerRef;
}
