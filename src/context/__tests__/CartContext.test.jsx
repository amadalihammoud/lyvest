import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider } from '../CartContext';
import { useCart } from '../../hooks/useCart';

// Wrapper para o Hook
const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe('CartContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should start with an empty cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        expect(result.current.cartItems).toEqual([]);
        expect(result.current.cartCount).toBe(0);
    });

    it('should add item to cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        const product = { id: 1, name: 'Produto Teste', price: 10, image: 'test.jpg' };

        act(() => {
            result.current.addToCart(product);
        });

        expect(result.current.cartItems).toHaveLength(1);
        expect(result.current.cartItems[0].qty).toBe(1);
        expect(result.current.cartTotal).toBe(10);
    });

    it('should increment quantity if item exists', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Produto Teste', price: 10, image: 'test.jpg' };

        act(() => {
            result.current.addToCart(product);
        });
        act(() => {
            result.current.addToCart(product);
        });

        expect(result.current.cartItems).toHaveLength(1);
        expect(result.current.cartItems[0].qty).toBe(2);
        expect(result.current.cartTotal).toBe(20);
    });

    it('should remove item from cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Produto Teste', price: 10, image: 'test.jpg' };

        act(() => {
            result.current.addToCart(product);
            result.current.removeFromCart(1);
        });

        expect(result.current.cartItems).toEqual([]);
    });
});







