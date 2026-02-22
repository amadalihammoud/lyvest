// src/store/useCartStore.ts
// Zustand store replacing CartContext — no provider needed
import { create } from 'zustand';

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

// Cupons válidos
const VALID_COUPONS: Record<string, number> = {
    'BEMVINDA10': 0.10,
    'LYVEST2026': 0.15,
    'PROMO5': 0.05,
};

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

function loadCartFromStorage(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed.slice(0, CART_MAX_ITEMS).map(validateCartItem).filter((item): item is CartItem => item !== null);
    } catch {
        try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* ignore */ }
        return [];
    }
}

function saveCartToStorage(items: CartItem[]) {
    if (typeof window === 'undefined') return;
    try {
        const validItems = items.slice(0, CART_MAX_ITEMS).map(validateCartItem).filter(Boolean);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
    } catch { /* ignore */ }
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
    applyCoupon: (code: string) => { success: boolean; message: string };
    removeCoupon: () => void;
    _hydrate: () => void;

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

export const useCartStore = create<CartState>((set, get) => ({
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

    _hydrate: () => {
        const savedCart = loadCartFromStorage();
        const derived = computeDerived(savedCart, 0);
        set({ cartItems: savedCart, _isHydrated: true, ...derived });
    },

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
        saveCartToStorage(newItems);
        set({ cartItems: newItems, ...computeDerived(newItems, state.discount) });
    },

    removeFromCart: (id) => {
        const state = get();
        const newItems = state.cartItems.filter((item) => item.id !== id);
        saveCartToStorage(newItems);
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
        saveCartToStorage(newItems);
        set({ cartItems: newItems, ...computeDerived(newItems, state.discount) });
    },

    clearCart: () => {
        saveCartToStorage([]);
        set({
            cartItems: [],
            couponCode: null,
            discount: 0,
            ...computeDerived([], 0),
        });
    },

    applyCoupon: (code: string) => {
        const normalizedCode = code.toUpperCase().trim();
        if (!normalizedCode) return { success: false, message: 'Digite um código válido.' };

        if (Object.prototype.hasOwnProperty.call(VALID_COUPONS, normalizedCode)) {
            const discountPercent = VALID_COUPONS[normalizedCode];
            const state = get();
            set({
                couponCode: normalizedCode,
                discount: discountPercent,
                ...computeDerived(state.cartItems, discountPercent),
            });
            return { success: true, message: `Cupom ${normalizedCode} aplicado! (${discountPercent * 100}% OFF)` };
        }

        return { success: false, message: 'Cupom inválido ou expirado.' };
    },

    removeCoupon: () => {
        const state = get();
        set({
            couponCode: null,
            discount: 0,
            ...computeDerived(state.cartItems, 0),
        });
    },
}));

// Auto-hydrate on client
if (typeof window !== 'undefined') {
    // Use requestIdleCallback or setTimeout to defer hydration
    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => useCartStore.getState()._hydrate());
    } else {
        setTimeout(() => useCartStore.getState()._hydrate(), 0);
    }
}

// Backward-compatible hook alias
export const useCart = useCartStore;
