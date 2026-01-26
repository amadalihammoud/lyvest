/* eslint-disable react-refresh/only-export-components */
// src/context/FavoritesContext.tsx
import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { FAVORITES_CONFIG } from '../config/constants';

interface FavoritesContextType {
    favorites: number[];
    toggleFavorite: (event: any, productId?: number) => void;
    addFavorite: (productId: number) => void;
    removeFavorite: (productId: number) => void;
    isFavorite: (productId: number) => boolean;
    favoritesCount: number;
    clearFavorites: () => void;
    maxFavorites: number;
}

export const FavoritesContext = createContext<FavoritesContextType | null>(null);

// Usar constantes centralizadas
const FAVORITES_STORAGE_KEY = FAVORITES_CONFIG.STORAGE_KEY;
const MAX_FAVORITES = FAVORITES_CONFIG.MAX_ITEMS;

/**
 * Valida que um ID é um número positivo válido
 */
function isValidId(id: any): boolean {
    return typeof id === 'number' && Number.isInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER;
}

/**
 * Carrega e valida favoritos do localStorage
 */
function loadFavoritesFromStorage(): number[] {
    try {
        const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);

        // Validar que é um array
        if (!Array.isArray(parsed)) {
            localStorage.removeItem(FAVORITES_STORAGE_KEY);
            return [];
        }

        // Filtrar apenas IDs válidos e limitar quantidade
        const validIds = parsed
            .filter(isValidId)
            .slice(0, MAX_FAVORITES);

        // Remover duplicatas
        return [...new Set(validIds)] as number[];
    } catch {
        // Se falhar, limpar dados corrompidos
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        return [];
    }
}

/**
 * Salva favoritos no localStorage com validação
 */
function saveFavoritesToStorage(favorites: number[]) {
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
    // Inicializar do localStorage com validação
    const [favorites, setFavorites] = useState<number[]>(loadFavoritesFromStorage);

    // Persistir no localStorage quando mudar
    useEffect(() => {
        saveFavoritesToStorage(favorites);
    }, [favorites]);

    const toggleFavorite = useCallback((event: any, productId?: number) => {
        // Se vier de um evento, evitar propagação
        if (event?.stopPropagation) {
            event.stopPropagation();
            event.preventDefault();
        }

        // Se productId for passado diretamente (sem evento)
        const id = typeof event === 'number' ? event : productId;

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

    const addFavorite = useCallback((productId: number) => {
        if (!isValidId(productId)) return;

        setFavorites((prev) => {
            if (prev.includes(productId)) return prev;
            if (prev.length >= MAX_FAVORITES) return prev;
            return [...prev, productId];
        });
    }, []);

    const removeFavorite = useCallback((productId: number) => {
        if (!isValidId(productId)) return;
        setFavorites((prev) => prev.filter((id) => id !== productId));
    }, []);

    const isFavorite = useCallback(
        (productId: number) => isValidId(productId) && favorites.includes(productId),
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
