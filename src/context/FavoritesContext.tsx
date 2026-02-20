/* eslint-disable react-refresh/only-export-components */
// src/context/FavoritesContext.tsx
'use client';
import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode, useRef } from 'react';
import { FAVORITES_CONFIG } from '../config/constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logger } from '../utils/logger';

interface FavoritesContextType {
    favorites: (number | string)[];
    toggleFavorite: (event: React.SyntheticEvent | number | string, productId?: number | string) => void;
    addFavorite: (productId: number | string) => void;
    removeFavorite: (productId: number | string) => void;
    isFavorite: (productId: number | string) => boolean;
    favoritesCount: number;
    clearFavorites: () => void;
    maxFavorites: number;
    // Internal methods for Sync component
    _syncWithUser?: (user: any) => Promise<void>;
    _setUserId?: (id: string | null) => void;
    _addToSupabase?: (productId: string, userId: string) => Promise<void>;
    _removeFromSupabase?: (productId: string, userId: string) => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextType | null>(null);

// Usar constantes centralizadas
const FAVORITES_STORAGE_KEY = FAVORITES_CONFIG.STORAGE_KEY;
const MAX_FAVORITES = FAVORITES_CONFIG.MAX_ITEMS;

/**
 * Valida que um ID é válido (número positivo ou string não vazia)
 */
function isValidId(id: unknown): boolean {
    if (typeof id === 'number') {
        return Number.isInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER;
    }
    if (typeof id === 'string') {
        return id.trim().length > 0;
    }
    return false;
}

/**
 * Verifica se é UUID válido para Supabase
 */
function isUuid(id: unknown): boolean {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Carrega e valida favoritos do localStorage
 */
function loadFavoritesFromStorage(): (number | string)[] {
    // SSR-safe: só acessar localStorage no cliente
    if (typeof window === 'undefined') return [];

    try {
        const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);

        // Validar que é um array
        if (!Array.isArray(parsed)) {
            try {
                localStorage.removeItem(FAVORITES_STORAGE_KEY);
            } catch {
                // Ignore
            }
            return [];
        }

        // Filtrar apenas IDs válidos e limitar quantidade
        const validIds = parsed
            .filter(isValidId)
            .slice(0, MAX_FAVORITES);

        // Remover duplicatas
        return [...new Set(validIds)] as (number | string)[];
    } catch {
        // Se falhar, limpar dados corrompidos
        try {
            localStorage.removeItem(FAVORITES_STORAGE_KEY);
        } catch {
            // Ignore
        }
        return [];
    }
}

/**
 * Salva favoritos no localStorage com validação
 */
function saveFavoritesToStorage(favorites: (number | string)[]) {
    // SSR-safe: só acessar localStorage no cliente
    if (typeof window === 'undefined') return;

    try {
        // Validar antes de salvar
        const validFavorites = favorites
            .filter(isValidId)
            .slice(0, MAX_FAVORITES);

        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(validFavorites));
    } catch {
        // Falha silenciosa (localStorage cheio, etc)
    }
}

interface FavoritesProviderProps {
    children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
    // Inicializar vazio - será preenchido pelo useEffect no cliente
    const [favorites, setFavorites] = useState<(number | string)[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Ref to store current user ID without triggering re-renders or dependency loops
    const userIdRef = useRef<string | null>(null);

    // 1. Hidratar do localStorage inicialmente (para feedback imediato)
    useEffect(() => {
        const savedFavorites = loadFavoritesFromStorage();
        if (savedFavorites.length > 0) {
            setFavorites(savedFavorites);
        }
        setIsHydrated(true);
    }, []);

    // 2. Persistir no localStorage quando mudar
    useEffect(() => {
        if (isHydrated) {
            saveFavoritesToStorage(favorites);
        }
    }, [favorites, isHydrated]);


    // Helper para adicionar ao Supabase (Exportado para uso no Sync ou wrapper)
    const addToSupabase = async (productId: string, userId: string) => {
        if (!userId || !isSupabaseConfigured() || !isUuid(productId)) return;
        try {
            await supabase.from('favorites').insert({
                user_id: userId,
                product_id: productId
            });
        } catch (err) {
            logger.error('Error adding favorite to cloud:', err);
        }
    };

    // Helper para remover do Supabase
    const removeFromSupabase = async (productId: string, userId: string) => {
        if (!userId || !isSupabaseConfigured() || !isUuid(productId)) return;
        try {
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('product_id', productId);
        } catch (err) {
            logger.error('Error removing favorite from cloud:', err);
        }
    };

    // Necessário expor funções de sync para o componente filho
    const syncWithUser = useCallback(async (user: any) => {
        if (!user || !isSupabaseConfigured()) return;

        try {
            // A. Buscar favoritos remotos
            const { data: remoteFavorites, error } = await supabase
                .from('favorites')
                .select('product_id')
                .eq('user_id', user.id);

            if (error) throw error;

            const remoteIds = remoteFavorites?.map(f => f.product_id) || [];
            const localIds = loadFavoritesFromStorage();

            // B. Identificar itens locais que não estão no remoto (novos para sync)
            const newRemoteItems = localIds.filter(id =>
                isUuid(id) && !remoteIds.includes(id as string)
            );

            // C. Salvar novos itens no Supabase
            if (newRemoteItems.length > 0) {
                await supabase
                    .from('favorites')
                    .insert(
                        newRemoteItems.map(id => ({
                            user_id: user.id,
                            product_id: id as string
                        }))
                    );
                logger.info(`Synced ${newRemoteItems.length} favorites to cloud.`);
            }

            // D. Atualizar estado local com a UNIÃO (Local + Remoto)
            const combinedIds = [...new Set([...localIds, ...remoteIds])];
            setFavorites(combinedIds);
            saveFavoritesToStorage(combinedIds);

        } catch (err) {
            logger.error('Error syncing favorites:', err);
        }
    }, []);

    // Internal setter for User ID
    const setUserId = useCallback((id: string | null) => {
        userIdRef.current = id;
    }, []);


    const toggleFavorite = useCallback((event: React.SyntheticEvent | number | string, productId?: number | string) => {
        if (typeof event === 'object' && event !== null && 'stopPropagation' in event) {
            (event as React.SyntheticEvent).stopPropagation();
            (event as React.SyntheticEvent).preventDefault();
        }

        const id = (typeof event === 'number' || typeof event === 'string') ? event : productId;

        if (!id || !isValidId(id)) return;

        setFavorites((prev) => {
            const isFav = prev.includes(id);
            const currentUserId = userIdRef.current;

            // Side effect: Persist to Supabase using currentUserId
            if (isFav) {
                if (currentUserId) removeFromSupabase(String(id), currentUserId);
                return prev.filter((favId) => favId !== id);
            } else {
                if (prev.length >= MAX_FAVORITES) return prev;
                if (currentUserId) addToSupabase(String(id), currentUserId);
                return [...prev, id];
            }
        });
    }, []);

    const addFavorite = useCallback((productId: number | string) => {
        if (!isValidId(productId)) return;

        setFavorites((prev) => {
            if (prev.includes(productId)) return prev;
            if (prev.length >= MAX_FAVORITES) return prev;

            const currentUserId = userIdRef.current;
            if (currentUserId) addToSupabase(String(productId), currentUserId);

            return [...prev, productId];
        });
    }, []);

    const removeFavorite = useCallback((productId: number | string) => {
        if (!isValidId(productId)) return;

        const currentUserId = userIdRef.current;
        if (currentUserId) removeFromSupabase(String(productId), currentUserId);

        setFavorites((prev) => prev.filter((id) => id !== productId));
    }, []);

    const isFavorite = useCallback(
        (productId: number | string) => isValidId(productId) && favorites.includes(productId),
        [favorites]
    );

    const favoritesCount = useMemo(() => favorites.length, [favorites]);

    const clearFavorites = useCallback(() => {
        setFavorites([]);
    }, []);

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                toggleFavorite,
                addFavorite,
                removeFavorite,
                isFavorite,
                favoritesCount,
                clearFavorites,
                maxFavorites: MAX_FAVORITES,
                _syncWithUser: syncWithUser,
                _setUserId: setUserId,
                _addToSupabase: addToSupabase,
                _removeFromSupabase: removeFromSupabase
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = React.useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites deve ser usado dentro de um FavoritesProvider');
    }
    return context;
};
