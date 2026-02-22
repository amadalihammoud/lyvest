// src/store/useFavoritesStore.ts
// Zustand store replacing FavoritesContext — no provider needed
import { create } from 'zustand';

import { FAVORITES_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

const FAVORITES_STORAGE_KEY = FAVORITES_CONFIG.STORAGE_KEY;
const MAX_FAVORITES = FAVORITES_CONFIG.MAX_ITEMS;

function isValidId(id: unknown): boolean {
    if (typeof id === 'number') return Number.isInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER;
    if (typeof id === 'string') return id.trim().length > 0;
    return false;
}

function isUuid(id: unknown): boolean {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function loadFavoritesFromStorage(): (number | string)[] {
    if (typeof window === 'undefined') return [];
    try {
        const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            try { localStorage.removeItem(FAVORITES_STORAGE_KEY); } catch { /* ignore */ }
            return [];
        }
        const validIds = parsed.filter(isValidId).slice(0, MAX_FAVORITES);
        return [...new Set(validIds)] as (number | string)[];
    } catch {
        try { localStorage.removeItem(FAVORITES_STORAGE_KEY); } catch { /* ignore */ }
        return [];
    }
}

function saveFavoritesToStorage(favorites: (number | string)[]) {
    if (typeof window === 'undefined') return;
    try {
        const validFavorites = favorites.filter(isValidId).slice(0, MAX_FAVORITES);
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(validFavorites));
    } catch { /* ignore */ }
}

async function loadSupabase() {
    const mod = await import('../lib/supabase');
    return mod;
}

interface FavoritesState {
    favorites: (number | string)[];
    _isHydrated: boolean;
    _userId: string | null;

    // Actions
    toggleFavorite: (event: React.SyntheticEvent | number | string, productId?: number | string) => void;
    addFavorite: (productId: number | string) => void;
    removeFavorite: (productId: number | string) => void;
    isFavorite: (productId: number | string) => boolean;
    clearFavorites: () => void;
    _hydrate: () => void;
    _syncWithUser: (user: any) => Promise<void>;
    _setUserId: (id: string | null) => void;
    _addToSupabase: (productId: string, userId: string) => Promise<void>;
    _removeFromSupabase: (productId: string, userId: string) => Promise<void>;

    // Computed
    favoritesCount: number;
    maxFavorites: number;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
    favorites: [],
    _isHydrated: false,
    _userId: null,

    // Computed defaults
    favoritesCount: 0,
    maxFavorites: MAX_FAVORITES,

    _hydrate: () => {
        const savedFavorites = loadFavoritesFromStorage();
        set({ favorites: savedFavorites, _isHydrated: true, favoritesCount: savedFavorites.length });
    },

    _setUserId: (id: string | null) => set({ _userId: id }),

    _addToSupabase: async (productId: string, userId: string) => {
        if (!userId || !isUuid(productId)) return;
        try {
            const { supabase, isSupabaseConfigured } = await loadSupabase();
            if (!isSupabaseConfigured()) return;
            await supabase.from('favorites').insert({ user_id: userId, product_id: productId });
        } catch (err) { logger.error('Error adding favorite to cloud:', err); }
    },

    _removeFromSupabase: async (productId: string, userId: string) => {
        if (!userId || !isUuid(productId)) return;
        try {
            const { supabase, isSupabaseConfigured } = await loadSupabase();
            if (!isSupabaseConfigured()) return;
            await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
        } catch (err) { logger.error('Error removing favorite from cloud:', err); }
    },

    _syncWithUser: async (user: any) => {
        if (!user) return;
        try {
            const { supabase, isSupabaseConfigured } = await loadSupabase();
            if (!isSupabaseConfigured()) return;

            const { data: remoteFavorites, error } = await supabase
                .from('favorites').select('product_id').eq('user_id', user.id);
            if (error) throw error;

            const remoteIds = remoteFavorites?.map((f: any) => f.product_id) || [];
            const localIds = loadFavoritesFromStorage();
            const newRemoteItems = localIds.filter(id => isUuid(id) && !remoteIds.includes(id as string));

            if (newRemoteItems.length > 0) {
                await supabase.from('favorites').insert(
                    newRemoteItems.map(id => ({ user_id: user.id, product_id: id as string }))
                );
                logger.info(`Synced ${newRemoteItems.length} favorites to cloud.`);
            }

            const combinedIds = [...new Set([...localIds, ...remoteIds])];
            saveFavoritesToStorage(combinedIds);
            set({ favorites: combinedIds, favoritesCount: combinedIds.length });
        } catch (err) { logger.error('Error syncing favorites:', err); }
    },

    toggleFavorite: (event, productId?) => {
        if (typeof event === 'object' && event !== null && 'stopPropagation' in event) {
            (event as React.SyntheticEvent).stopPropagation();
            (event as React.SyntheticEvent).preventDefault();
        }

        const id = (typeof event === 'number' || typeof event === 'string') ? event : productId;
        if (!id || !isValidId(id)) return;

        const state = get();
        const isFav = state.favorites.includes(id);

        if (isFav) {
            if (state._userId) state._removeFromSupabase(String(id), state._userId);
            const newFavs = state.favorites.filter((favId) => favId !== id);
            saveFavoritesToStorage(newFavs);
            set({ favorites: newFavs, favoritesCount: newFavs.length });
        } else {
            if (state.favorites.length >= MAX_FAVORITES) return;
            if (state._userId) state._addToSupabase(String(id), state._userId);
            const newFavs = [...state.favorites, id];
            saveFavoritesToStorage(newFavs);
            set({ favorites: newFavs, favoritesCount: newFavs.length });
        }
    },

    addFavorite: (productId) => {
        if (!isValidId(productId)) return;
        const state = get();
        if (state.favorites.includes(productId)) return;
        if (state.favorites.length >= MAX_FAVORITES) return;

        if (state._userId) state._addToSupabase(String(productId), state._userId);
        const newFavs = [...state.favorites, productId];
        saveFavoritesToStorage(newFavs);
        set({ favorites: newFavs, favoritesCount: newFavs.length });
    },

    removeFavorite: (productId) => {
        if (!isValidId(productId)) return;
        const state = get();
        if (state._userId) state._removeFromSupabase(String(productId), state._userId);
        const newFavs = state.favorites.filter((id) => id !== productId);
        saveFavoritesToStorage(newFavs);
        set({ favorites: newFavs, favoritesCount: newFavs.length });
    },

    isFavorite: (productId) => {
        return isValidId(productId) && get().favorites.includes(productId);
    },

    clearFavorites: () => {
        saveFavoritesToStorage([]);
        set({ favorites: [], favoritesCount: 0 });
    },
}));

// Auto-hydrate on client
if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => useFavoritesStore.getState()._hydrate());
    } else {
        setTimeout(() => useFavoritesStore.getState()._hydrate(), 0);
    }
}

// Backward-compatible hook alias
export const useFavorites = useFavoritesStore;
