// src/components/__tests__/Header.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../layout/Header';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Mock all context hooks
vi.mock('../../context/I18nContext', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'common.search': 'Buscar...',
                'nav.login': 'Entrar',
                'aria.openMenu': 'Abrir menu',
                'aria.cart': 'Carrinho',
                'aria.favorites': 'Favoritos',
            };
            return translations[key] || key;
        },
        formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
    }),
}));

vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        items: [],
        cartCount: 0,
        addToCart: vi.fn(),
    }),
}));

vi.mock('../../context/FavoritesContext', () => ({
    useFavorites: () => ({
        favorites: [],
        toggleFavorite: vi.fn(),
    }),
}));

vi.mock('../../context/ModalContext', () => ({
    useModal: () => ({
        openModal: vi.fn(),
        closeModal: vi.fn(),
        openDrawer: vi.fn(),
        closeDrawer: vi.fn(),
    }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
    }),
}));

vi.mock('../../context/ShopContext', () => ({
    useShop: () => ({
        selectedCategory: 'Todos',
        setSelectedCategory: vi.fn(),
    }),
}));

vi.mock('../../hooks/useShopNavigation', () => ({
    useShopNavigation: () => ({
        handleMenuClick: vi.fn(),
    }),
}));

describe('Header', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders logo', () => {
        render(<Header />);
        const logo = screen.getByAltText('Ly Vest Logo');
        expect(logo).toBeInTheDocument();
    });

    it('renders search input on desktop', () => {
        render(<Header />);
        const searchInputs = screen.getAllByRole('textbox');
        expect(searchInputs.length).toBeGreaterThan(0);
    });

    it('renders login button when not logged in', () => {
        render(<Header />);
        expect(screen.getByText(/entrar/i)).toBeInTheDocument();
    });
});
