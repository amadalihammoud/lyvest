// src/store/useShopStore.ts
// Zustand store replacing ShopContext — no provider needed
import { create } from 'zustand';

interface ShopState {
    searchQuery: string;
    selectedCategory: string;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string) => void;
    resetShopState: () => void;
}

export const useShopStore = create<ShopState>((set) => ({
    searchQuery: '',
    selectedCategory: 'Todos',
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setSelectedCategory: (category: string) => set({ selectedCategory: category }),
    resetShopState: () => set({ searchQuery: '', selectedCategory: 'Todos' }),
}));

// Backward-compatible hook alias
export const useShop = useShopStore;
