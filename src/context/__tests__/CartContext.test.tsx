import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { describe, it, expect, beforeEach } from 'vitest';

// Helper component to test the hook
const TestComponent = () => {
    const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();

    return (
        <div>
            <div data-testid="cart-count">{cartCount}</div>
            <div data-testid="cart-total">{cartTotal}</div>
            <div data-testid="cart-items-length">{cartItems.length}</div>
            <button onClick={() => addToCart({ id: 1, name: 'Test Product', price: 100, image: 'img.jpg', category: 'General' })}>Add Item 1</button>
            <button onClick={() => addToCart({ id: 2, name: 'Test Product 2', price: 50, image: 'img2.jpg', category: 'General' })}>Add Item 2</button>
            <button onClick={() => removeFromCart(1)}>Remove Item 1</button>
            <button onClick={() => updateQuantity(1, 5)}>Update Qty Item 1</button>
            <button onClick={() => clearCart()}>Clear Cart</button>
        </div>
    );
};

describe('CartContext Integration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should start empty', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );
        expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
        expect(screen.getByTestId('cart-total')).toHaveTextContent('0');
    });

    it('should add items correctly', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        const addButton = screen.getByText('Add Item 1');
        act(() => {
            addButton.click();
        });

        expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
        expect(screen.getByTestId('cart-total')).toHaveTextContent('100');
    });

    it('should accumulate quantity for same item', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        const addButton = screen.getByText('Add Item 1');
        act(() => {
            addButton.click();
            addButton.click();
        });

        expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
        expect(screen.getByTestId('cart-total')).toHaveTextContent('200');
        expect(screen.getByTestId('cart-items-length')).toHaveTextContent('1'); // Still 1 unique item
    });

    it('should handle different items', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
            screen.getByText('Add Item 2').click();
        });

        expect(screen.getByTestId('cart-count')).toHaveTextContent('2'); // 1 of each
        expect(screen.getByTestId('cart-total')).toHaveTextContent('150'); // 100 + 50
    });

    it('should remove items', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
            screen.getByText('Remove Item 1').click();
        });

        expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    });

    it('should update quantity', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
            screen.getByText('Update Qty Item 1').click(); // Sets to 5
        });

        expect(screen.getByTestId('cart-count')).toHaveTextContent('5');
        expect(screen.getByTestId('cart-total')).toHaveTextContent('500'); // 100 * 5
    });

    it('should clear cart', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
            screen.getByText('Add Item 2').click();
            screen.getByText('Clear Cart').click();
        });

        expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
        expect(screen.getByTestId('cart-total')).toHaveTextContent('0');
    });
});
