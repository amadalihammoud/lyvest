'use client';
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define context shape
interface ShopContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    resetShopState: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const resetShopState = useCallback(() => {
        setSearchQuery('');
        setSelectedCategory('Todos');
    }, []);

    // Memoize value to prevent unnecessary re-renders
    const value = React.useMemo(() => ({
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        resetShopState
    }), [searchQuery, selectedCategory, resetShopState]);

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => {
    const context = useContext(ShopContext);
    if (context === undefined) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};
