import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../ProductCard';

const mockProduct = {
    id: 1,
    name: 'Planner 2026',
    price: 89.90,
    oldPrice: 120.00,
    image: 'https://placehold.co/400x400',
    category: 'Planners',
    rating: 5,
    reviews: 10
};

// Wrapper with Router for components using Link
const renderWithRouter = (ui) => {
    return render(
        <BrowserRouter>{ui}</BrowserRouter>
    );
};

describe('ProductCard', () => {
    it('renders product information correctly', () => {
        renderWithRouter(
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

    it('calls onAddToCart when add button is clicked', () => {
        const handleAddToCart = vi.fn();
        renderWithRouter(
            <ProductCard
                product={mockProduct}
                isFavorite={false}
                onToggleFavorite={() => { }}
                onAddToCart={handleAddToCart}
                onQuickView={() => { }}
            />
        );

        const addButton = screen.getByLabelText(`Adicionar ${mockProduct.name} ao carrinho`);
        fireEvent.click(addButton);

        expect(handleAddToCart).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleFavorite when heart icon is clicked', () => {
        const handleToggleFavorite = vi.fn();
        renderWithRouter(
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

    it('navigates to product page when clicked', () => {
        renderWithRouter(
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
        renderWithRouter(
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







