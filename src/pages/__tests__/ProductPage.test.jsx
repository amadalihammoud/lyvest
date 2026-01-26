// src/pages/__tests__/ProductPage.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductPage from '../ProductPage';
import { CartProvider } from '../../context/CartContext';
import { FavoritesProvider } from '../../context/FavoritesContext';
import { ModalProvider } from '../../context/ModalContext';
import { I18nProvider } from '../../context/I18nContext';

// Mock useParams to return a valid slug
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ slug: 'planner-anual-2026-bloom' }),
        useOutletContext: () => ({
            user: null,
            isLoggedIn: false,
        }),
    };
});

const renderProductPage = () => {
    return render(
        <BrowserRouter>
            <I18nProvider>
                <CartProvider>
                    <FavoritesProvider>
                        <ModalProvider>
                            <ProductPage />
                        </ModalProvider>
                    </FavoritesProvider>
                </CartProvider>
            </I18nProvider>
        </BrowserRouter>
    );
};

describe('ProductPage', () => {
    it('renders product name', () => {
        renderProductPage();
        // The product should be found by slug
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders buy button', () => {
        renderProductPage();
        expect(screen.getByText(/Comprar/i)).toBeInTheDocument();
    });

    it('renders product price', () => {
        renderProductPage();
        expect(screen.getByText(/R\$/)).toBeInTheDocument();
    });

    it('renders shipping calculator', () => {
        renderProductPage();
        expect(screen.getByText(/Frete e Prazo/i)).toBeInTheDocument();
    });

    it('renders related products section', () => {
        renderProductPage();
        expect(screen.getByText(/Produtos Relacionados/i)).toBeInTheDocument();
    });

    it('renders description section', () => {
        renderProductPage();
        expect(screen.getByText(/Descrição Geral/i)).toBeInTheDocument();
    });
});







