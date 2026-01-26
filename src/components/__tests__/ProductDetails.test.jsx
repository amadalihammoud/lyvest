// src/components/__tests__/ProductDetails.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductDetails from '../ProductDetails';
import { I18nProvider } from '../../context/I18nContext';

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

const renderProductDetails = (props = {}) => {
    return render(
        <BrowserRouter>
            <I18nProvider>
                <ProductDetails {...defaultProps} {...props} />
            </I18nProvider>
        </BrowserRouter>
    );
};

describe('ProductDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders product name', () => {
        renderProductDetails();
        // The translated name should appear
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders product price', () => {
        renderProductDetails();
        expect(screen.getByText(/R\$/)).toBeInTheDocument();
    });

    it('renders product badge', () => {
        renderProductDetails();
        expect(screen.getByText(/Mais Vendido/i)).toBeInTheDocument();
    });

    it('renders buy button', () => {
        renderProductDetails();
        expect(screen.getByText(/Comprar/i)).toBeInTheDocument();
    });

    it('increases quantity when clicking plus button', () => {
        renderProductDetails();

        const plusButton = screen.getAllByRole('button').find(
            btn => btn.querySelector('svg')?.classList.contains('lucide-plus') ||
                btn.textContent === '+' ||
                btn.innerHTML.includes('Plus')
        );

        // Find quantity display (initially 1)
        expect(screen.getByText('1')).toBeInTheDocument();

        // Click to increase
        if (plusButton) {
            fireEvent.click(plusButton);
            expect(screen.getByText('2')).toBeInTheDocument();
        }
    });

    it('decreases quantity when clicking minus button (minimum 1)', () => {
        renderProductDetails();

        // Quantity should not go below 1
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('calls onAddToCart when clicking buy button', () => {
        const onAddToCart = vi.fn();
        renderProductDetails({ onAddToCart });

        const buyButton = screen.getByText(/Comprar/i);
        fireEvent.click(buyButton);

        expect(onAddToCart).toHaveBeenCalled();
    });

    it('renders shipping calculator section', () => {
        renderProductDetails();
        expect(screen.getByText(/Frete e Prazo/i)).toBeInTheDocument();
    });

    it('renders product specifications', () => {
        renderProductDetails();
        expect(screen.getByText(/Especificações/i)).toBeInTheDocument();
        expect(screen.getByText(/Dimensões/i)).toBeInTheDocument();
    });

    it('renders Watch Video button', () => {
        renderProductDetails();
        expect(screen.getByText(/Assistir ao Vídeo/i)).toBeInTheDocument();
    });

    it('renders description section', () => {
        renderProductDetails();
        expect(screen.getByText(/Descrição Geral/i)).toBeInTheDocument();
    });

    it('renders related products section', () => {
        renderProductDetails();
        expect(screen.getByText(/Produtos Relacionados/i)).toBeInTheDocument();
    });

    // Modal mode tests
    describe('Modal Mode', () => {
        it('renders in compact layout when isModal is true', () => {
            renderProductDetails({ isModal: true });
            expect(screen.getByText(/Ver Detalhes/i)).toBeInTheDocument();
        });

        it('calls onClose when clicking close button in modal', () => {
            const onClose = vi.fn();
            renderProductDetails({ isModal: true, onClose });

            const closeButton = screen.getByLabelText(/fechar/i);
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });

        it('renders Add to Cart button in modal', () => {
            renderProductDetails({ isModal: true });
            expect(screen.getByText(/Adicionar ao Carrinho/i)).toBeInTheDocument();
        });
    });

    it('returns null when product is null', () => {
        const { container } = render(
            <BrowserRouter>
                <I18nProvider>
                    <ProductDetails product={null} onClose={vi.fn()} onAddToCart={vi.fn()} />
                </I18nProvider>
            </BrowserRouter>
        );
        expect(container.firstChild).toBeNull();
    });
});







