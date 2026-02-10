/* eslint-disable react-refresh/only-export-components */
// src/context/FavoritesContext.tsx
'use client';
import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { FAVORITES_CONFIG } from '../config/constants';

interface FavoritesContextType {
    favorites: (number | string)[];
    toggleFavorite: (event: React.SyntheticEvent | number | string, productId?: number | string) => void;
    addFavorite: (productId: number | string) => void;
    removeFavorite: (productId: number | string) => void;
    isFavorite: (productId: number | string) => boolean;
    favoritesCount: number;
    clearFavorites: () => void;
    maxFavorites: number;
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
    // MUDANÇA: Aceita number ou string
    const [favorites, setFavorites] = useState<(number | string)[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hidratar do localStorage apenas no cliente
    useEffect(() => {
        const savedFavorites = loadFavoritesFromStorage();
        if (savedFavorites.length > 0) {
            setFavorites(savedFavorites);
        }
        setIsHydrated(true);
    }, []);

    // Persistir no localStorage quando mudar (apenas após hidratação)
    useEffect(() => {
        if (isHydrated) {
            saveFavoritesToStorage(favorites);
        }
    }, [favorites, isHydrated]);

    const toggleFavorite = useCallback((event: React.SyntheticEvent | number | string, productId?: number | string) => {
        // Se vier de um evento, evitar propagação
        if (typeof event === 'object' && event !== null && 'stopPropagation' in event) {
            (event as React.SyntheticEvent).stopPropagation();
            (event as React.SyntheticEvent).preventDefault();
        }

        // Se productId for passado diretamente (sem evento)
        const id = (typeof event === 'number' || typeof event === 'string') ? event : productId;

        // Validar ID
        if (!id || !isValidId(id)) return;

        setFavorites((prev) => {
            if (prev.includes(id)) {
                return prev.filter((favId) => favId !== id);
            }
            // Verificar limite antes de adicionar
            if (prev.length >= MAX_FAVORITES) {
                return prev;
            }
            return [...prev, id];
        });
    }, []);

    const addFavorite = useCallback((productId: number | string) => {
        if (!isValidId(productId)) return;

        setFavorites((prev) => {
            if (prev.includes(productId)) return prev;
            if (prev.length >= MAX_FAVORITES) return prev;
            return [...prev, productId];
        });
    }, []);

    const removeFavorite = useCallback((productId: number | string) => {
        if (!isValidId(productId)) return;
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
                maxFavorites: MAX_FAVORITES
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
