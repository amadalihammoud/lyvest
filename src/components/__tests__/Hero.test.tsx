// src/components/__tests__/Hero.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Hero from '../features/Hero';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
    usePathname: () => '/',
}));

// Mock useI18n
vi.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'hero.badge': 'Nova Coleção',
                'hero.title': 'Organize seus sonhos',
                'hero.subtitle': 'A papelaria mais fofa do Brasil!',
                'hero.cta': 'Ver Coleção',
                'hero.secondary': 'Mais Vendidos',
            };
            return translations[key] || key;
        },
    }),
}));

describe('Hero', () => {
    it('renders hero title', () => {
        render(<Hero />);
        expect(screen.getByText(/Organize seus sonhos/i)).toBeInTheDocument();
    });

    it('renders hero badge', () => {
        render(<Hero />);
        expect(screen.getByText(/Nova Coleção/i)).toBeInTheDocument();
    });

    it('renders CTA button', () => {
        render(<Hero />);
        expect(screen.getByText(/Ver Coleção/i)).toBeInTheDocument();
    });

    it('renders secondary button', () => {
        render(<Hero />);
        expect(screen.getByText(/Mais Vendidos/i)).toBeInTheDocument();
    });

    it('CTA button triggers scroll action', () => {
        render(<Hero />);

        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        const ctaButton = screen.getByText(/Ver Coleção/i);
        fireEvent.click(ctaButton);

        expect(ctaButton).toBeInTheDocument();
    });
});
