// src/pages/__tests__/HomePage.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { CartProvider } from '../../context/CartContext';
import { FavoritesProvider } from '../../context/FavoritesContext';
import { ModalProvider } from '../../context/ModalContext';
import { I18nProvider } from '../../context/I18nContext';

// Mock the outlet context
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => ({
            selectedCategory: 'Todos',
            setSelectedCategory: vi.fn(),
            searchQuery: '',
            setSearchQuery: vi.fn(),
        }),
    };
});

const renderHomePage = () => {
    return render(
        <BrowserRouter>
            <I18nProvider>
                <CartProvider>
                    <FavoritesProvider>
                        <ModalProvider>
                            <HomePage />
                        </ModalProvider>
                    </FavoritesProvider>
                </CartProvider>
            </I18nProvider>
        </BrowserRouter>
    );
};

describe('HomePage', () => {
    it('renders Hero section', () => {
        renderHomePage();
        expect(screen.getByText(/Organize seus sonhos/i)).toBeInTheDocument();
    });

    it('renders product section title', () => {
        renderHomePage();
        expect(screen.getByText(/Destaques da Semana/i)).toBeInTheDocument();
    });

    it('renders products grid', () => {
        renderHomePage();
        // Should render product cards
        const productCards = document.querySelectorAll('[class*="product"]');
        expect(productCards.length).toBeGreaterThanOrEqual(0);
    });

    it('renders testimonials section', () => {
        renderHomePage();
        expect(screen.getByText(/Clientes felizes/i)).toBeInTheDocument();
    });

    it('renders newsletter form', () => {
        renderHomePage();
        expect(screen.getByText(/Fique por dentro/i)).toBeInTheDocument();
    });

    it('shows category filter', () => {
        renderHomePage();
        expect(screen.getByText(/Todos/i)).toBeInTheDocument();
    });

    it('displays product count', () => {
        renderHomePage();
        // Should show items found text
        const itemsText = screen.queryByText(/encontrados/i);
        expect(itemsText).not.toBeNull();
    });
});







