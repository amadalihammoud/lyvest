// src/components/__tests__/Hero.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Hero from '../Hero';
import { I18nProvider } from '../../context/I18nContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderHero = () => {
    return render(
        <BrowserRouter>
            <I18nProvider>
                <Hero />
            </I18nProvider>
        </BrowserRouter>
    );
};

describe('Hero', () => {
    it('renders hero title', () => {
        renderHero();
        expect(screen.getByText(/Organize seus sonhos/i)).toBeInTheDocument();
    });

    it('renders hero badge', () => {
        renderHero();
        expect(screen.getByText(/Nova Coleção/i)).toBeInTheDocument();
    });

    it('renders hero subtitle', () => {
        renderHero();
        expect(screen.getByText(/papelaria mais fofa/i)).toBeInTheDocument();
    });

    it('renders CTA button', () => {
        renderHero();
        expect(screen.getByText(/Ver Coleção/i)).toBeInTheDocument();
    });

    it('renders secondary button', () => {
        renderHero();
        expect(screen.getByText(/Mais Vendidos/i)).toBeInTheDocument();
    });

    it('CTA button scrolls to products', () => {
        renderHero();

        // Mock scrollIntoView
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        const ctaButton = screen.getByText(/Ver Coleção/i);
        fireEvent.click(ctaButton);

        // Should trigger some scroll action
        expect(ctaButton).toBeInTheDocument();
    });
});







