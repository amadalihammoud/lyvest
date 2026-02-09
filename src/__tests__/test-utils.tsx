/**
 * Mock do Next.js Navigation para testes
 * Substituir BrowserRouter por este wrapper
 */
import React, { ReactNode } from 'react';
import { vi } from 'vitest';

// Mock do next/navigation
export const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
};

export const mockPathname = '/';
export const mockSearchParams = new URLSearchParams();

// Mock providers para contextos
vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => mockPathname,
    useSearchParams: () => mockSearchParams,
    useParams: () => ({}),
    redirect: vi.fn(),
}));

// Contextos mock
const mockI18n = {
    t: (key: string) => key,
    locale: 'pt-BR',
    setLocale: vi.fn(),
    formatCurrency: (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    getProductData: () => null,
};

const mockCart = {
    items: [],
    cartCount: 0,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    cartTotal: 0,
};

const mockFavorites = {
    favorites: [],
    toggleFavorite: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    isFavorite: () => false,
};

const mockModal = {
    openModal: vi.fn(),
    closeModal: vi.fn(),
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
    isOpen: false,
    modalType: null,
    modalData: null,
};

// Provider wrapper para testes
interface TestProviderProps {
    children: ReactNode;
}

export function TestProvider({ children }: TestProviderProps) {
    return <>{children}</>;
}

// Mock dos hooks de contexto
vi.mock('@/context/I18nContext', () => ({
    useI18n: () => mockI18n,
    I18nProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/CartContext', () => ({
    useCart: () => mockCart,
    CartProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/FavoritesContext', () => ({
    useFavorites: () => mockFavorites,
    FavoritesProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/ModalContext', () => ({
    useModal: () => mockModal,
    ModalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Exportar mocks para acesso nos testes
export { mockI18n, mockCart, mockFavorites, mockModal };

// Reset all mocks between tests
export function resetAllMocks() {
    vi.clearAllMocks();
}
