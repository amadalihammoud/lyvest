/* eslint-disable react-refresh/only-export-components */
// src/context/CartContext.tsx
import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { CART_CONFIG } from '../config/constants';

// Interface para o item do carrinho
export interface CartItem {
    id: number;
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
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, qty: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
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
    if (typeof i.id !== 'number' || i.id <= 0) return null;
    if (typeof i.name !== 'string' || i.name.length === 0 || i.name.length > 200) return null;
    if (typeof i.price !== 'number' || i.price < 0 || i.price > 100000) return null;
    if (typeof i.qty !== 'number' || i.qty <= 0 || i.qty > CART_MAX_QUANTITY) return null;

    // Sanitizar e retornar apenas campos necessários
    return {
        id: Math.floor(i.id),
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
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
    }
}

/**
 * Salva carrinho no localStorage com validação
 */
function saveCartToStorage(items: CartItem[]) {
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
    // Inicializar do localStorage com validação
    const [cartItems, setCartItems] = useState<CartItem[]>(loadCartFromStorage);

    // Persistir no localStorage quando mudar
    useEffect(() => {
        saveCartToStorage(cartItems);
    }, [cartItems]);

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

    const removeFromCart = useCallback((id: number) => {
        if (typeof id !== 'number') return;
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateQuantity = useCallback((id: number, qty: number) => {
        if (typeof id !== 'number') return;
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
    }, []);

    const cartTotal = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
        [cartItems]
    );

    const cartCount = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.qty, 0),
        [cartItems]
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount
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
