import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../../hooks/useCart';
import { CartProvider } from '../../context/CartContext';

// Wrapper para provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
);

describe('useCart Hook', () => {
    describe('Adicionar e Remover Itens', () => {
        it('deve adicionar item ao carrinho', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = {
                id: 1,
                name: 'Calcinha Test',
                price: 49.90,
                image: '/test.jpg'
            };

            act(() => {
                result.current.addToCart(product);
            });

            expect(result.current.cartItems).toHaveLength(1);
            expect(result.current.cartCount).toBe(1);
            expect(result.current.cartTotal).toBe(49.90);
        });

        it('deve incrementar quantidade se produto já existe', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = {
                id: 1,
                name: 'Calcinha Test',
                price: 49.90,
                image: '/test.jpg'
            };

            act(() => {
                result.current.addToCart(product);
                result.current.addToCart(product);
            });

            expect(result.current.cartItems).toHaveLength(1);
            expect(result.current.cartItems[0].qty).toBe(2);
            expect(result.current.cartTotal).toBe(99.80);
        });

        it('deve remover item do carrinho', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = {
                id: 1,
                name: 'Calcinha Test',
                price: 49.90,
                image: '/test.jpg'
            };

            act(() => {
                result.current.addToCart(product);
                result.current.removeFromCart(1);
            });

            expect(result.current.cartItems).toHaveLength(0);
            expect(result.current.cartTotal).toBe(0);
        });

        it('deve limpar carrinho', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product1 = { id: 1, name: 'Item 1', price: 50, image: '/1.jpg' };
            const product2 = { id: 2, name: 'Item 2', price: 75, image: '/2.jpg' };

            act(() => {
                result.current.addToCart(product1);
                result.current.addToCart(product2);
                result.current.clearCart();
            });

            expect(result.current.cartItems).toHaveLength(0);
            expect(result.current.cartTotal).toBe(0);
        });
    });

    describe('Cupons de Desconto', () => {
        it('deve aplicar cupom BEMVINDA10 (10% off)', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 100, image: '/test.jpg' };

            act(() => {
                result.current.addToCart(product);
                result.current.applyCoupon('BEMVINDA10');
            });

            expect(result.current.discount).toBe(0.10);
            expect(result.current.discountAmount).toBe(10);
            expect(result.current.finalTotal).toBe(90);
        });

        it('deve aplicar cupom LYVEST2026 (15% off)', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 200, image: '/test.jpg' };

            act(() => {
                result.current.addToCart(product);
                result.current.applyCoupon('LYVEST2026');
            });

            expect(result.current.discount).toBe(0.15);
            expect(result.current.discountAmount).toBe(30);
            expect(result.current.finalTotal).toBe(170);
        });

        it('deve rejeitar cupom inválido', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 100, image: '/test.jpg' };

            act(() => {
                result.current.addToCart(product);
            });

            const resultCoupon = result.current.applyCoupon('INVALIDO');

            expect(resultCoupon.success).toBe(false);
            expect(resultCoupon.message).toContain('inválido');
            expect(result.current.discount).toBe(0);
        });

        it('deve remover cupom aplicado', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 100, image: '/test.jpg' };

            act(() => {
                result.current.addToCart(product);
                result.current.applyCoupon('PROMO5');
                result.current.removeCoupon();
            });

            expect(result.current.couponCode).toBeNull();
            expect(result.current.discount).toBe(0);
            expect(result.current.finalTotal).toBe(100);
        });
    });

    describe('Frete Grátis (R$ 199)', () => {
        it('deve indicar frete grátis para carrinho >= R$ 199', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 199, image: '/test.jpg' };

            act(() => {
                result.current.addToCart(product);
            });

            expect(result.current.freeShippingEligible).toBe(true);
            expect(result.current.freeShippingMinimum).toBe(199);
        });

        it('NÃO deve indicar frete grátis para carrinho < R$ 199', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 150, image: '/test.jpg' };

            act(() => {
                result.current.addToCart(product);
            });

            expect(result.current.freeShippingEligible).toBe(false);
        });

        it('deve reavaliar frete grátis ao adicionar/remover itens', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product1 = { id: 1, name: 'Item 1', price: 100, image: '/1.jpg' };
            const product2 = { id: 2, name: 'Item 2', price: 100, image: '/2.jpg' };

            // Adicionar item 1 (R$ 100) - Sem frete grátis
            act(() => {
                result.current.addToCart(product1);
            });
            expect(result.current.freeShippingEligible).toBe(false);

            // Adicionar item 2 (R$ 200 total) - Com frete grátis
            act(() => {
                result.current.addToCart(product2);
            });
            expect(result.current.freeShippingEligible).toBe(true);

            // Remover item 2 (R$ 100 total) - Sem frete grátis novamente
            act(() => {
                result.current.removeFromCart(2);
            });
            expect(result.current.freeShippingEligible).toBe(false);
        });
    });

    describe('Persistência em localStorage', () => {
        it('deve persistir itens no localStorage', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 50, image: '/test.jpg' };

            act(() => {
                result.current.addToCart(product);
            });

            // Verificar localStorage
            const stored = localStorage.getItem('lyvest_cart');
            expect(stored).toBeTruthy();

            const parsed = JSON.parse(stored!);
            expect(parsed).toHaveLength(1);
            expect(parsed[0].id).toBe(1);
        });
    });

    describe('Limites e Validações', () => {
        it('deve respeitar quantidade máxima por item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            const product = { id: 1, name: 'Test', price: 50, image: '/test.jpg' };

            // Adicionar múltiplas vezes
            act(() => {
                for (let i = 0; i < 15; i++) {
                    result.current.addToCart(product);
                }
            });

            // Deve limitar a 10 (se houver validação)
            // Ajustar expect baseado na lógica do CartContext
            expect(result.current.cartItems[0].qty).toBeLessThanOrEqual(10);
        });
    });
});
