/* eslint-disable react-refresh/only-export-components */
// src/context/FavoritesContext.tsx
'use client';
import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { FAVORITES_CONFIG } from '../config/constants';
import { useUser } from '@clerk/nextjs';
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
    const { user, isLoaded } = useUser();
    // Inicializar vazio - será preenchido pelo useEffect no cliente
    // MUDANÇA: Aceita number ou string
    const [favorites, setFavorites] = useState<(number | string)[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // 1. Hidratar do localStorage inicialmente (para feedback imediato)
    useEffect(() => {
        const savedFavorites = loadFavoritesFromStorage();
        if (savedFavorites.length > 0) {
            setFavorites(savedFavorites);
        }
        setIsHydrated(true);
    }, []);

    // 2. Sincronizar com Supabase ao logar
    useEffect(() => {
        const syncFavorites = async () => {
            if (!isLoaded || !user || !isSupabaseConfigured()) return;

            try {
                // A. Buscar favoritos remotos
                const { data: remoteFavorites, error } = await supabase
                    .from('favorites')
                    .select('product_id')
                    .eq('user_id', user.id);

                if (error) throw error;

                const remoteIds = remoteFavorites?.map(f => f.product_id) || [];
                const localIds = loadFavoritesFromStorage(); // Pega direto do storage para garantir

                // B. Identificar itens locais que não estão no remoto (novos para sync)
                // Apenas UUIDs podem ser salvos no Supabase
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
                // Remoto ganha em caso de conflito, mas aqui estamos somando
                const combinedIds = [...new Set([...localIds, ...remoteIds])];
                setFavorites(combinedIds);

                // E. Atualizar localStorage com a lista completa
                saveFavoritesToStorage(combinedIds);

            } catch (err) {
                logger.error('Error syncing favorites:', err);
            }
        };

        if (isHydrated) {
            syncFavorites();
        }
    }, [user, isLoaded, isHydrated]);

    // 3. Persistir no localStorage quando mudar
    useEffect(() => {
        if (isHydrated) {
            saveFavoritesToStorage(favorites);
        }
    }, [favorites, isHydrated]);


    // Helper para adicionar ao Supabase
    const addToSupabase = async (productId: string) => {
        if (!user || !isSupabaseConfigured() || !isUuid(productId)) return;
        try {
            await supabase.from('favorites').insert({
                user_id: user.id,
                product_id: productId
            });
        } catch (err) {
            logger.error('Error adding favorite to cloud:', err);
        }
    };

    // Helper para remover do Supabase
    const removeFromSupabase = async (productId: string) => {
        if (!user || !isSupabaseConfigured() || !isUuid(productId)) return;
        try {
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);
        } catch (err) {
            logger.error('Error removing favorite from cloud:', err);
        }
    };

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
            const isFav = prev.includes(id);

            // Side effect: Persist to Supabase
            if (isFav) {
                removeFromSupabase(String(id));
                return prev.filter((favId) => favId !== id);
            } else {
                if (prev.length >= MAX_FAVORITES) return prev;
                addToSupabase(String(id));
                return [...prev, id];
            }
        });
    }, [user]); // user é dependência agora

    const addFavorite = useCallback((productId: number | string) => {
        if (!isValidId(productId)) return;

        setFavorites((prev) => {
            if (prev.includes(productId)) return prev;
            if (prev.length >= MAX_FAVORITES) return prev;

            addToSupabase(String(productId));
            return [...prev, productId];
        });
    }, [user]);

    const removeFavorite = useCallback((productId: number | string) => {
        if (!isValidId(productId)) return;

        removeFromSupabase(String(productId));
        setFavorites((prev) => prev.filter((id) => id !== productId));
    }, [user]);

    const isFavorite = useCallback(
        (productId: number | string) => isValidId(productId) && favorites.includes(productId),
        [favorites]
    );

    const favoritesCount = useMemo(() => favorites.length, [favorites]);

    const clearFavorites = useCallback(() => {
        setFavorites([]);
        // Opcional: Limpar tudo do Supabase também? 
        // Por segurança, talvez não limpar nuvem ao limpar local, ou perguntar.
        // Mas 'clearFavorites' geralmente é logout ou ação destrutiva.
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
