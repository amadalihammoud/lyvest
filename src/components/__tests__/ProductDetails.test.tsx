// src/components/__tests__/ProductDetails.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductDetails from '../product/ProductDetails';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
    usePathname: () => '/produto/test',
}));

// Mock useI18n
vi.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'products.buy': 'Comprar',
                'products.addToCart': 'Adicionar ao Carrinho',
                'products.viewDetails': 'Ver Detalhes',
                'products.shipping': 'Frete e Prazo',
                'products.specs': 'Especificações',
                'products.watchVideo': 'Assistir ao Vídeo',
                'products.description': 'Descrição Geral',
                'products.related': 'Produtos Relacionados',
                'aria.close': 'Fechar',
                'aria.increaseQuantity': 'Aumentar quantidade',
                'aria.decreaseQuantity': 'Diminuir quantidade',
            };
            return translations[key] || key;
        },
        formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
        getProductData: () => null,
    }),
}));

// Mock cart context
vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        addToCart: vi.fn(),
    }),
}));

// Mock modal context
vi.mock('../../context/ModalContext', () => ({
    useModal: () => ({
        openModal: vi.fn(),
    }),
}));

const mockProduct = {
    id: 1,
    name: 'Planner Anual 2026 - Bloom',
    description: 'Organize o seu ano com a delicadeza das flores.',
    price: 89.90,
    image: '/product1.jpg',
    rating: 4.8,
    reviews: 156,
    badge: 'Mais Vendido',
    category: 'Planners',
    specs: {
        'Dimensões': 'A5 (15 x 21 cm)',
        'Folhas': '200 páginas',
    },
};

const defaultProps = {
    product: mockProduct,
    onClose: vi.fn(),
    onAddToCart: vi.fn(),
    isModal: false,
};

describe('ProductDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders product name', () => {
        render(<ProductDetails {...defaultProps} />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders product price', () => {
        render(<ProductDetails {...defaultProps} />);
        expect(screen.getByText(/R\$/)).toBeInTheDocument();
    });

    it('renders product badge', () => {
        render(<ProductDetails {...defaultProps} />);
        expect(screen.getByText(/Mais Vendido/i)).toBeInTheDocument();
    });

    it('renders buy button', () => {
        render(<ProductDetails {...defaultProps} />);
        expect(screen.getByText(/Comprar/i)).toBeInTheDocument();
    });

    it('renders quantity 1 by default', () => {
        render(<ProductDetails {...defaultProps} />);
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('calls onAddToCart when clicking buy button', () => {
        const onAddToCart = vi.fn();
        render(<ProductDetails {...defaultProps} onAddToCart={onAddToCart} />);

        const buyButton = screen.getByText(/Comprar/i);
        fireEvent.click(buyButton);

        expect(onAddToCart).toHaveBeenCalled();
    });

    it('renders shipping calculator section', () => {
        render(<ProductDetails {...defaultProps} />);
        expect(screen.getByText(/Frete e Prazo/i)).toBeInTheDocument();
    });

    it('renders product specifications', () => {
        render(<ProductDetails {...defaultProps} />);
        expect(screen.getByText(/Especificações/i)).toBeInTheDocument();
        expect(screen.getByText(/Dimensões/i)).toBeInTheDocument();
    });

    describe('Modal Mode', () => {
        it('renders Ver Detalhes button when isModal is true', () => {
            render(<ProductDetails {...defaultProps} isModal={true} />);
            expect(screen.getByText(/Ver Detalhes/i)).toBeInTheDocument();
        });

        it('calls onClose when clicking close button in modal', () => {
            const onClose = vi.fn();
            render(<ProductDetails {...defaultProps} isModal={true} onClose={onClose} />);

            const closeButton = screen.getByLabelText(/fechar/i);
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });
    });

    it('returns null when product is null', () => {
        const { container } = render(
            <ProductDetails product={null} onClose={vi.fn()} onAddToCart={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });
});
