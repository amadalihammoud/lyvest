import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesProvider } from '../FavoritesContext';
import { useFavorites } from '../../hooks/useFavorites';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        clear: vi.fn(() => { store = {}; }),
        removeItem: vi.fn((key) => { delete store[key]; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Wrapper para o Hook
const wrapper = ({ children }) => <FavoritesProvider>{children}</FavoritesProvider>;

describe('FavoritesContext', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    it('should start with empty favorites', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });
        expect(result.current.favorites).toEqual([]);
        expect(result.current.favoritesCount).toBe(0);
    });

    it('should add item to favorites with toggleFavorite', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.toggleFavorite(1);
        });

        expect(result.current.favorites).toEqual([1]);
        expect(result.current.favoritesCount).toBe(1);
        expect(result.current.isFavorite(1)).toBe(true);
    });

    it('should remove item from favorites with toggleFavorite', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.toggleFavorite(1);
        });

        expect(result.current.isFavorite(1)).toBe(true);

        act(() => {
            result.current.toggleFavorite(1);
        });

        expect(result.current.favorites).toEqual([]);
        expect(result.current.isFavorite(1)).toBe(false);
    });

    it('should add multiple favorites', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.toggleFavorite(1);
            result.current.toggleFavorite(2);
            result.current.toggleFavorite(3);
        });

        expect(result.current.favorites).toEqual([1, 2, 3]);
        expect(result.current.favoritesCount).toBe(3);
    });

    it('should add favorite with addFavorite method', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.addFavorite(5);
        });

        expect(result.current.favorites).toContain(5);
    });

    it('should not duplicate when adding same favorite twice with addFavorite', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.addFavorite(5);
            result.current.addFavorite(5);
        });

        expect(result.current.favorites.filter(id => id === 5)).toHaveLength(1);
    });

    it('should remove specific favorite with removeFavorite', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.addFavorite(1);
            result.current.addFavorite(2);
            result.current.addFavorite(3);
        });

        act(() => {
            result.current.removeFavorite(2);
        });

        expect(result.current.favorites).toEqual([1, 3]);
    });

    it('should clear all favorites', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.addFavorite(1);
            result.current.addFavorite(2);
        });

        expect(result.current.favoritesCount).toBe(2);

        act(() => {
            result.current.clearFavorites();
        });

        expect(result.current.favorites).toEqual([]);
        expect(result.current.favoritesCount).toBe(0);
    });

    it('should handle event object in toggleFavorite', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        const mockEvent = {
            stopPropagation: vi.fn(),
            preventDefault: vi.fn(),
        };

        act(() => {
            result.current.toggleFavorite(mockEvent, 10);
        });

        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(result.current.favorites).toContain(10);
    });

    it('should persist to localStorage', () => {
        const { result } = renderHook(() => useFavorites(), { wrapper });

        act(() => {
            result.current.addFavorite(1);
        });

        expect(localStorageMock.setItem).toHaveBeenCalled();
    });
});







