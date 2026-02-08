/**
 * Tipos centralizados do E-commerce Ly Vest
 * 
 * Este arquivo define tipos compartilhados em toda a aplicação
 * para garantir consistência e segurança de tipos.
 */

// ============================================
// Product Types
// ============================================

export interface ColorOption {
    name: string;
    hex: string;
}

export interface InstallmentOption {
    count: number;
    value: number;
}

export interface ProductSpecs {
    material?: string;
    composition?: string;
    care?: string;
    [key: string]: string | number | undefined;
}

export interface ProductCategory {
    name: string;
    slug: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category?: ProductCategory | ProductCategory[] | string;
    specs?: ProductSpecs;
    ean?: string;
    active?: boolean;
    stock_quantity?: number;
    sizes?: string[];
    colors?: ColorOption[];
    quantity?: number;
    badge?: string | null;
    rating?: number;
    reviews?: number;
    video?: string;
    oldPrice?: number;
    installments?: InstallmentOption;
}

// ============================================
// Cart Types
// ============================================

export interface CartItem extends Product {
    qty: number;
    selectedSize?: string;
    selectedColor?: ColorOption;
}

// ============================================
// Modal Types
// ============================================

export type ModalType =
    | 'login'
    | 'register'
    | 'quickview'
    | 'sizeGuide'
    | 'addedToCart'
    | 'checkout'
    | 'tracking'
    | 'newsletter'
    | 'lgpd'
    | null;

export type DrawerType =
    | 'cart'
    | 'favorites'
    | 'tracking'
    | null;

// ============================================
// Tracking Types
// ============================================

export interface TrackingHistory {
    status: string;
    date: string;
    label?: string;
    location?: string;
}

export interface TrackingResult {
    status: string;
    date: string;
    location?: string;
    history?: TrackingHistory[];
}

// ============================================
// Filter Types
// ============================================

export interface FilterState {
    minPrice: number;
    maxPrice: number;
    sizes: string[];
    colors: string[];
}

export interface PriceRange {
    min: number;
    max: number;
}

// ============================================
// User Types
// ============================================

export interface DashboardUser {
    id: string;
    email: string;
    name: string;
    created_at?: string;
}

// ============================================
// Window Extensions (for mock data, not Vercel which has its own types)
// ============================================

declare global {
    interface Window {
        mockOrders?: import('./dashboard').Order[];
    }
}

export { };
