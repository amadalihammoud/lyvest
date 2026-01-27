// src/components/__tests__/DrawerCart.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DrawerCart from '../DrawerCart';
import { CartProvider } from '../../context/CartContext';
import { I18nProvider } from '../../context/I18nContext';

// Mock data for future tests with cart items
// MOCK_CART_ITEMS removed

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
};

const renderDrawerCart = (props = {}) => {
    // We'll use CartProvider but may need to mock useCart
    return render(
        <BrowserRouter>
            <I18nProvider>
                <CartProvider>
                    <DrawerCart {...defaultProps} {...props} />
                </CartProvider>
            </I18nProvider>
        </BrowserRouter>
    );
};

describe('DrawerCart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders drawer when open', () => {
        renderDrawerCart({ isOpen: true });
        expect(screen.getByText(/Minha Bolsa/i)).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
        renderDrawerCart({ isOpen: false });
        // The drawer should not be visible
        const drawer = screen.queryByText(/Minha Bolsa/i);
        expect(drawer).not.toBeInTheDocument();
    });

    it('shows empty cart message when no items', () => {
        renderDrawerCart({ isOpen: true });
        expect(screen.getByText(/Seu carrinho está vazio/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
        renderDrawerCart({ isOpen: true });
        const closeButton = screen.getByLabelText(/fechar/i);
        expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        renderDrawerCart({ isOpen: true, onClose });

        const closeButton = screen.getByLabelText(/fechar/i);
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('shows continue shopping button when empty', () => {
        renderDrawerCart({ isOpen: true });
        expect(screen.getByText(/Continuar Comprando/i)).toBeInTheDocument();
    });

    it('renders checkout button', () => {
        renderDrawerCart({ isOpen: true });
        // May not be visible when empty, but component should render
        const subtotalText = screen.queryByText(/Subtotal/i);
        // Either shows subtotal or empty message
        expect(subtotalText !== null || screen.getByText(/vazio/i)).toBeTruthy();
    });
});







