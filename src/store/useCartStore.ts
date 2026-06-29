// src/store/useCartStore.ts
// Zustand store replacing CartContext — no provider needed
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

const CART_STORAGE_KEY = CART_CONFIG.STORAGE_KEY;
const CART_MAX_ITEMS = CART_CONFIG.MAX_ITEMS;
const CART_MAX_QUANTITY = CART_CONFIG.MAX_QUANTITY_PER_ITEM;
const FREE_SHIPPING_MIN = 199;

function validateCartItem(item: unknown): CartItem | null {
    if (!item || typeof item !== 'object') return null;
    const i = item as Record<string, unknown>;

    if ((typeof i.id !== 'number' && typeof i.id !== 'string') || !i.id) return null;
    if (typeof i.id === 'number' && i.id <= 0) return null;
    if (typeof i.name !== 'string' || i.name.length === 0 || i.name.length > 200) return null;
    if (typeof i.price !== 'number' || i.price < 0 || i.price > 100000) return null;
    if (typeof i.qty !== 'number' || i.qty <= 0 || i.qty > CART_MAX_QUANTITY) return null;

    return {
        id: typeof i.id === 'number' ? Math.floor(i.id) : String(i.id),
        name: String(i.name).slice(0, 200).replace(/<[^>]*>/g, ''),
        price: Math.abs(Number(i.price)),
        qty: Math.min(Math.floor(i.qty), CART_MAX_QUANTITY),
        image: typeof i.image === 'string' ? i.image.slice(0, 500) : '',
        category: typeof i.category === 'string' ? i.category.slice(0, 100) : ''
    };
}

interface CartState {
    cartItems: CartItem[];
    couponCode: string | null;
    discount: number;
    _isHydrated: boolean;

    // Actions
    addToCart: (product: Partial<CartItem>) => void;
    removeFromCart: (id: number | string) => void;
    updateQuantity: (id: number | string, qty: number) => void;
    clearCart: () => void;
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => void;

    // Computed (as getters via selectors)
    cartTotal: number;
    cartCount: number;
    discountAmount: number;
    finalTotal: number;
    freeShippingEligible: boolean;
    freeShippingMinimum: number;
}

// Helper to recompute derived state
function computeDerived(items: CartItem[], discount: number) {
    const cartTotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
    const cartCount = items.reduce((acc, item) => acc + item.qty, 0);
    const discountAmount = cartTotal * discount;
    const finalTotal = Math.max(0, cartTotal - discountAmount);
    const freeShippingEligible = cartTotal >= FREE_SHIPPING_MIN;
    return { cartTotal, cartCount, discountAmount, finalTotal, freeShippingEligible };
}

export const useCartStore = create<CartState>()(persist((set, get) => ({
    cartItems: [],
    couponCode: null,
    discount: 0,
    _isHydrated: false,

    // Computed defaults
    cartTotal: 0,
    cartCount: 0,
    discountAmount: 0,
    finalTotal: 0,
    freeShippingEligible: false,
    freeShippingMinimum: FREE_SHIPPING_MIN,

    addToCart: (product) => {
        const qtyToAdd = product.qty && typeof product.qty === 'number' && product.qty > 0 ? product.qty : 1;
        const validProduct = validateCartItem({ ...product, qty: qtyToAdd });
        if (!validProduct) return;

        const state = get();
        const prev = state.cartItems;
        if (prev.length >= CART_MAX_ITEMS) return;

        const existing = prev.find((item) => item.id === validProduct.id);
        let newItems: CartItem[];
        if (existing) {
            newItems = prev.map((item) =>
                item.id === validProduct.id
                    ? { ...item, qty: Math.min(item.qty + validProduct.qty, CART_MAX_QUANTITY) }
                    : item
            );
        } else {
            newItems = [...prev, validProduct];
        }
        set({ cartItems: newItems, ...computeDerived(newItems, state.discount) });
    },

    removeFromCart: (id) => {
        const state = get();
        const newItems = state.cartItems.filter((item) => item.id !== id);
        set({ cartItems: newItems, ...computeDerived(newItems, state.discount) });
    },

    updateQuantity: (id, qty) => {
        if (typeof qty !== 'number' || qty < 0) return;
        const state = get();
        let newItems: CartItem[];
        if (qty <= 0) {
            newItems = state.cartItems.filter((item) => item.id !== id);
        } else {
            newItems = state.cartItems.map((item) =>
                item.id === id ? { ...item, qty: Math.min(Math.floor(qty), CART_MAX_QUANTITY) } : item
            );
        }
        set({ cartItems: newItems, ...computeDerived(newItems, state.discount) });
    },

    clearCart: () => {
        set({
            cartItems: [],
            couponCode: null,
            discount: 0,
            ...computeDerived([], 0),
        });
    },

    applyCoupon: async (code: string) => {
        const normalizedCode = code.toUpperCase().trim();
        if (!normalizedCode) return { success: false, message: 'Digite um código válido.' };

        const cartTotal = get().cartTotal;

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: normalizedCode, cartTotal }),
            });
            const data: { valid: boolean; discount: number; message: string } = await res.json();

            if (!data.valid) {
                return { success: false, message: data.message };
            }

            const state = get();
            set({
                couponCode: normalizedCode,
                discount: data.discount,
                ...computeDerived(state.cartItems, data.discount),
            });
            return { success: true, message: data.message };
        } catch {
            return { success: false, message: 'Erro ao validar cupom. Tente novamente.' };
        }
    },

    removeCoupon: () => {
        const state = get();
        set({
            couponCode: null,
            discount: 0,
            ...computeDerived(state.cartItems, 0),
        });
    },
}), {
    name: CART_STORAGE_KEY,
    storage: createJSONStorage(() => localStorage),
    // Defer hydration to the client to avoid SSR mismatch (triggered below).
    skipHydration: true,
    // Only persist raw data — derived fields are recomputed on rehydration.
    partialize: (state) => ({
        cartItems: state.cartItems,
        couponCode: state.couponCode,
        discount: state.discount,
    }),
    // Re-validate persisted items and recompute derived values when merging.
    merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        const validItems = Array.isArray(p.cartItems)
            ? p.cartItems
                .slice(0, CART_MAX_ITEMS)
                .map(validateCartItem)
                .filter((item): item is CartItem => item !== null)
            : [];
        const discount = typeof p.discount === 'number' ? p.discount : 0;
        return {
            ...current,
            cartItems: validItems,
            couponCode: typeof p.couponCode === 'string' ? p.couponCode : null,
            discount,
            ...computeDerived(validItems, discount),
        };
    },
    onRehydrateStorage: () => () => {
        useCartStore.setState({ _isHydrated: true });
    },
}));

// Defer hydration to the client (idle) to avoid SSR mismatch.
if (typeof window !== 'undefined') {
    const rehydrate = () => { void useCartStore.persist.rehydrate(); };
    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(rehydrate);
    } else {
        setTimeout(rehydrate, 0);
    }
}

// Backward-compatible hook alias
export const useCart = useCartStore;
