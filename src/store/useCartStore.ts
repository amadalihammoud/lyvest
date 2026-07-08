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

// Cupons: NÃO ficam no cliente (fonte única = servidor, src/config/coupons.ts).
// A validação é feita via POST /api/coupons/validate.

// Helpers de validação (mantêm validateCartItem com baixa complexidade)
function isValidCartId(id: unknown): boolean {
    if (typeof id === 'number') return id > 0;
    return typeof id === 'string' && id.length > 0;
}
function isValidCartName(v: unknown): boolean {
    return typeof v === 'string' && v.length > 0 && v.length <= 200;
}
function isNumberInRange(v: unknown, min: number, max: number): boolean {
    return typeof v === 'number' && v >= min && v <= max;
}
function isPositiveMax(v: unknown, max: number): boolean {
    return typeof v === 'number' && v > 0 && v <= max;
}
function sanitizeCartStr(v: unknown, max: number): string {
    return typeof v === 'string' ? v.slice(0, max) : '';
}

function validateCartItem(item: unknown): CartItem | null {
    if (!item || typeof item !== 'object') return null;
    const i = item as Record<string, unknown>;

    if (!isValidCartId(i.id)) return null;
    if (!isValidCartName(i.name)) return null;
    if (!isNumberInRange(i.price, 0, 100000)) return null;
    if (!isPositiveMax(i.qty, CART_MAX_QUANTITY)) return null;

    return {
        id: typeof i.id === 'number' ? Math.floor(i.id) : String(i.id),
        name: sanitizeCartStr(i.name, 200).replace(/<[^>]*>/g, ''),
        price: Math.abs(i.price as number),
        qty: Math.min(Math.floor(i.qty as number), CART_MAX_QUANTITY),
        image: sanitizeCartStr(i.image, 500),
        category: sanitizeCartStr(i.category, 100)
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
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
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

    applyCoupon: async (code: string) => {
        const normalizedCode = code.toUpperCase().trim();
        if (!normalizedCode) return { success: false, message: 'Digite um código válido.' };

        try {
            const { cartTotal } = get();
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: normalizedCode, cartTotal }),
            });
            const data = await res.json();

            if (!res.ok || !data.valid) {
                return { success: false, message: data?.message || 'Cupom inválido ou expirado.' };
            }

            // Defesa: fração de desconto limitada a [0,1] (o servidor recalcula o real no pagamento).
            const safeDiscount = Math.min(Math.max(Number(data.discount) || 0, 0), 1);
            set({
                couponCode: normalizedCode,
                discount: safeDiscount,
                ...computeDerived(get().cartItems, safeDiscount),
            });
            return { success: true, message: data.message };
        } catch {
            return { success: false, message: 'Não foi possível validar o cupom agora. Tente novamente.' };
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
}));

// Auto-hydrate on client
if (typeof window !== 'undefined') {
    // Use requestIdleCallback or setTimeout to defer hydration
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => useCartStore.getState()._hydrate());
    } else {
        setTimeout(() => useCartStore.getState()._hydrate(), 0);
    }
}

// Backward-compatible hook alias
export const useCart = useCartStore;
