// src/components/__tests__/DrawerCart.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DrawerCart from '../layout/DrawerCart';

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
                'cart.title': 'Minha Bolsa',
                'cart.empty': 'Seu carrinho está vazio',
                'cart.continueShopping': 'Continuar Comprando',
                'cart.subtotal': 'Subtotal',
                'aria.close': 'Fechar',
            };
            return translations[key] || key;
        },
        formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
    }),
}));

// Mock cart context
vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        items: [],
        cartCount: 0,
        cartTotal: 0,
        addToCart: vi.fn(),
        removeFromCart: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
    }),
}));

// Mock modal context
vi.mock('../../context/ModalContext', () => ({
    useModal: () => ({
        closeDrawer: vi.fn(),
    }),
}));

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
};

describe('DrawerCart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders drawer when open', () => {
        render(<DrawerCart {...defaultProps} />);
        expect(screen.getByText(/Minha Bolsa/i)).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
        render(<DrawerCart {...defaultProps} isOpen={false} />);
        const drawer = screen.queryByText(/Minha Bolsa/i);
        expect(drawer).not.toBeInTheDocument();
    });

    it('shows empty cart message when no items', () => {
        render(<DrawerCart {...defaultProps} />);
        expect(screen.getByText(/Seu carrinho está vazio/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
        render(<DrawerCart {...defaultProps} />);
        const closeButton = screen.getByLabelText(/fechar/i);
        expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<DrawerCart {...defaultProps} onClose={onClose} />);

        const closeButton = screen.getByLabelText(/fechar/i);
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('shows continue shopping button when empty', () => {
        render(<DrawerCart {...defaultProps} />);
        expect(screen.getByText(/Continuar Comprando/i)).toBeInTheDocument();
    });
});
