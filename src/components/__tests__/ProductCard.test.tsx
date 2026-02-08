import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../product/ProductCard';

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Mock hooks
vi.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'aria.addToFavorites': 'Adicionar aos favoritos',
                'aria.removeFromFavorites': 'Remover dos favoritos',
                'aria.quickView': 'Visualização rápida',
                'aria.decreaseQuantity': 'Diminuir quantidade',
                'aria.increaseQuantity': 'Aumentar quantidade',
                'products.buy': 'Comprar',
                'products.installments': '12x de R$ {amount}',
            };
            return translations[key] || key;
        },
        formatCurrency: (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`,
        getProductData: () => null,
    }),
}));

const mockProduct = {
    id: 1,
    name: 'Planner 2026',
    price: 89.90,
    oldPrice: 120.00,
    image: 'https://placehold.co/400x400',
    category: 'Planners',
    rating: 5,
    reviews: 10,
    description: 'Test description',
};

describe('ProductCard', () => {
    it('renders product information correctly', () => {
        render(
            <ProductCard
                product={mockProduct}
                isFavorite={false}
                onToggleFavorite={() => { }}
                onAddToCart={() => { }}
                onQuickView={() => { }}
            />
        );

        expect(screen.getByText('Planner 2026')).toBeInTheDocument();
        expect(screen.getByText('R$ 89,90')).toBeInTheDocument();
    });

    it('calls onAddToCart when buy button is clicked', () => {
        const handleAddToCart = vi.fn();
        render(
            <ProductCard
                product={mockProduct}
                isFavorite={false}
                onToggleFavorite={() => { }}
                onAddToCart={handleAddToCart}
                onQuickView={() => { }}
            />
        );

        const addButton = screen.getByTestId('add-to-cart-button');
        fireEvent.click(addButton);

        expect(handleAddToCart).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleFavorite when heart icon is clicked', () => {
        const handleToggleFavorite = vi.fn();
        render(
            <ProductCard
                product={mockProduct}
                isFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={() => { }}
                onQuickView={() => { }}
            />
        );

        const favButton = screen.getByLabelText('Adicionar aos favoritos');
        fireEvent.click(favButton);

        expect(handleToggleFavorite).toHaveBeenCalledTimes(1);
    });

    it('has correct link to product page', () => {
        render(
            <ProductCard
                product={mockProduct}
                isFavorite={false}
                onToggleFavorite={() => { }}
                onAddToCart={() => { }}
                onQuickView={() => { }}
            />
        );

        const productLink = screen.getByRole('link');
        expect(productLink).toHaveAttribute('href', '/produto/planner-2026');
    });

    it('shows filled heart when product is favorite', () => {
        render(
            <ProductCard
                product={mockProduct}
                isFavorite={true}
                onToggleFavorite={() => { }}
                onAddToCart={() => { }}
                onQuickView={() => { }}
            />
        );

        const favButton = screen.getByLabelText('Remover dos favoritos');
        expect(favButton).toBeInTheDocument();
    });
});
