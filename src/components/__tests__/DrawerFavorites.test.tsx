// src/components/__tests__/DrawerFavorites.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DrawerFavorites from '../layout/DrawerFavorites';

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Mock useI18n
vi.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'favorites.title': 'Meus Favoritos',
                'favorites.empty': 'Nenhum favorito ainda',
                'favorites.addAllToCart': 'Adicionar todos ao carrinho',
                'aria.close': 'Fechar',
            };
            return translations[key] || key;
        },
        formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
    }),
}));

// Mock favorites context
vi.mock('../../context/FavoritesContext', () => ({
    useFavorites: () => ({
        favorites: [],
        toggleFavorite: vi.fn(),
        removeFavorite: vi.fn(),
    }),
}));

// Mock cart context
vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        items: [],
        addToCart: vi.fn(),
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

describe('DrawerFavorites', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders drawer when open', () => {
        render(<DrawerFavorites {...defaultProps} />);
        expect(screen.getByText(/Meus Favoritos/i)).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
        render(<DrawerFavorites {...defaultProps} isOpen={false} />);
        const drawer = screen.queryByText(/Meus Favoritos/i);
        expect(drawer).not.toBeInTheDocument();
    });

    it('shows empty favorites message when no items', () => {
        render(<DrawerFavorites {...defaultProps} />);
        expect(screen.getByText(/Nenhum favorito ainda/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
        render(<DrawerFavorites {...defaultProps} />);
        const closeButton = screen.getByLabelText(/fechar/i);
        expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<DrawerFavorites {...defaultProps} onClose={onClose} />);

        const closeButton = screen.getByLabelText(/fechar/i);
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('shows heart emoji tip when empty', () => {
        render(<DrawerFavorites {...defaultProps} />);
        expect(screen.getByText(/❤️/)).toBeInTheDocument();
    });
});
