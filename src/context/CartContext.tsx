/* eslint-disable react-refresh/only-export-components */
// src/context/CartContext.tsx
'use client';
import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';

import { CART_CONFIG } from '../config/constants';

// Interface para o item do carrinho
export interface CartItem {
    id: number | string;
    name: string;
    price: number;
    qty: number;
    image: string;
    category: string;
}

// Interface para o contexto
interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Partial<CartItem>) => void;
    removeFromCart: (id: number | string) => void;
    updateQuantity: (id: number | string, qty: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    // Coupon properties
    couponCode: string | null;
    discount: number;
    discountAmount: number;
    finalTotal: number;
    applyCoupon: (code: string) => { success: boolean; message: string };
    removeCoupon: () => void;
    // Free shipping
    freeShippingEligible: boolean;
    freeShippingMinimum: number;
}

export const CartContext = createContext<CartContextType | null>(null);

// Usar constantes centralizadas
const CART_STORAGE_KEY = CART_CONFIG.STORAGE_KEY;
const CART_MAX_ITEMS = CART_CONFIG.MAX_ITEMS;
const CART_MAX_QUANTITY = CART_CONFIG.MAX_QUANTITY_PER_ITEM;

/**
 * Valida estrutura de um item do carrinho
 * Previne injeção de dados maliciosos via localStorage
 */
function validateCartItem(item: unknown): CartItem | null {
    if (!item || typeof item !== 'object') return null;
    const i = item as Record<string, unknown>;

    // Validar campos obrigatórios
    if ((typeof i.id !== 'number' && typeof i.id !== 'string') || !i.id) return null;
    if (typeof i.id === 'number' && i.id <= 0) return null; // ID numérico deve ser positivo

    if (typeof i.name !== 'string' || i.name.length === 0 || i.name.length > 200) return null;
    if (typeof i.price !== 'number' || i.price < 0 || i.price > 100000) return null;
    if (typeof i.qty !== 'number' || i.qty <= 0 || i.qty > CART_MAX_QUANTITY) return null;

    // Sanitizar e retornar apenas campos necessários
    return {
        id: typeof i.id === 'number' ? Math.floor(i.id) : String(i.id),
        name: String(i.name).slice(0, 200).replace(/<[^>]*>/g, ''), // Remove HTML
        price: Math.abs(Number(i.price)),
        qty: Math.min(Math.floor(i.qty), CART_MAX_QUANTITY),
        image: typeof i.image === 'string' ? i.image.slice(0, 500) : '',
        category: typeof i.category === 'string' ? i.category.slice(0, 100) : ''
    };
}

/**
 * Carrega e valida carrinho do localStorage
 */
function loadCartFromStorage(): CartItem[] {
    // SSR-safe: só acessar localStorage no cliente
    if (typeof window === 'undefined') return [];

    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);

        // Validar que é um array
        if (!Array.isArray(parsed)) return [];

        // Validar cada item e limitar quantidade
        const validItems = parsed
            .slice(0, CART_MAX_ITEMS)
            .map(validateCartItem)
            .filter((item): item is CartItem => item !== null);

        return validItems;
    } catch {
        // Se falhar, limpar dados corrompidos
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
        } catch {
            // Ignore se não conseguir remover
        }
        return [];
    }
}

/**
 * Salva carrinho no localStorage com validação
 */
function saveCartToStorage(items: CartItem[]) {
    // SSR-safe: só acessar localStorage no cliente
    if (typeof window === 'undefined') return;

    try {
        // Validar antes de salvar
        const validItems = items
            .slice(0, CART_MAX_ITEMS)
            .map(validateCartItem)
            .filter(Boolean);

        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
    } catch {
        // Falha silenciosa (localStorage cheio, etc)
    }
}

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
    // Inicializar vazio - será preenchido pelo useEffect no cliente
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Estado para cupons
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);

    // Hidratar do localStorage apenas no cliente
    useEffect(() => {
        const savedCart = loadCartFromStorage();
        if (savedCart.length > 0) {
            setCartItems(savedCart);
        }
        setIsHydrated(true);
    }, []);

    // Persistir no localStorage quando mudar (apenas após hidratação)
    useEffect(() => {
        if (isHydrated) {
            saveCartToStorage(cartItems);
        }
    }, [cartItems, isHydrated]);

    // Cupons Mockados (Simulação de Backend)
    const VALID_COUPONS: Record<string, number> = {
        'BEMVINDA10': 0.10,   // 10% off
        'LYVEST2026': 0.15,   // 15% off
        'PROMO5': 0.05,       // 5% off
    };

    // Constante de frete grátis
    const FREE_SHIPPING_MIN = 199;

    const applyCoupon = useCallback((code: string): { success: boolean, message: string } => {
        const normalizedCode = code.toUpperCase().trim();

        if (!normalizedCode) {
            return { success: false, message: 'Digite um código válido.' };
        }

        if (Object.prototype.hasOwnProperty.call(VALID_COUPONS, normalizedCode)) {
            // Verificar regras (ex: mínimo de compra) se necessário
            const discountPercent = VALID_COUPONS[normalizedCode];

            setCouponCode(normalizedCode);
            setDiscount(discountPercent);

            return {
                success: true,
                message: `Cupom ${normalizedCode} aplicado! (${discountPercent * 100}% OFF)`
            };
        }

        return { success: false, message: 'Cupom inválido ou expirado.' };
    }, []);

    const removeCoupon = useCallback(() => {
        setCouponCode(null);
        setDiscount(0);
    }, []);

    const addToCart = useCallback((product: Partial<CartItem>) => {
        // Validar produto antes de adicionar
        // Usa a quantidade informada ou 1 se não informada
        const qtyToAdd = product.qty && typeof product.qty === 'number' && product.qty > 0 ? product.qty : 1;
        const validProduct = validateCartItem({ ...product, qty: qtyToAdd });

        if (!validProduct) return;

        setCartItems((prev) => {
            // Verificar limite de itens
            if (prev.length >= CART_MAX_ITEMS) {
                return prev;
            }

            const existing = prev.find((item) => item.id === validProduct.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === validProduct.id
                        ? { ...item, qty: Math.min(item.qty + validProduct.qty, CART_MAX_QUANTITY) }
                        : item
                );
            }
            return [...prev, validProduct];
        });
    }, []);

    const removeFromCart = useCallback((id: number | string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateQuantity = useCallback((id: number | string, qty: number) => {
        if (typeof qty !== 'number' || qty < 0) return;

        setCartItems((prev) => {
            if (qty <= 0) {
                return prev.filter((item) => item.id !== id);
            }
            return prev.map((item) =>
                item.id === id
                    ? { ...item, qty: Math.min(Math.floor(qty), CART_MAX_QUANTITY) }
                    : item
            );
        });
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
        setCouponCode(null);
        setDiscount(0);
    }, []);

    const cartTotal = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
        [cartItems]
    );

    const discountAmount = useMemo(() => {
        return cartTotal * discount;
    }, [cartTotal, discount]);

    const finalTotal = useMemo(() => {
        return Math.max(0, cartTotal - discountAmount);
    }, [cartTotal, discountAmount]);

    const cartCount = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.qty, 0),
        [cartItems]
    );

    // Verifica se é elegível para frete grátis
    const freeShippingEligible = useMemo(() => cartTotal >= FREE_SHIPPING_MIN, [cartTotal]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount,
                // Coupon Props
                couponCode,
                discount,
                discountAmount,
                finalTotal,
                applyCoupon,
                removeCoupon,
                // Free Shipping
                freeShippingEligible,
                freeShippingMinimum: FREE_SHIPPING_MIN
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = React.useContext(CartContext);
    if (!context) {
        throw new Error('useCart deve ser usado dentro de um CartProvider');
    }
    return context;
};
