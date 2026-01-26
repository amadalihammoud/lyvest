// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para gerenciar valores no localStorage
 * - Sincroniza entre abas do navegador
 * - Trata erros de parsing
 * - Suporta valores iniciais funcionais
 */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    // Estado que mantém o valor atual
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            if (item !== null) {
                return JSON.parse(item);
            }
            // Se não existe, usa o valor inicial
            const value = initialValue instanceof Function ? initialValue() : initialValue;
            return value;
        } catch (error) {
            console.warn(`Erro ao ler localStorage key "${key}":`, error);
            return initialValue instanceof Function ? initialValue() : initialValue;
        }
    });

    // Função para atualizar o valor
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        try {
            // Permite valores funcionais como setState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));

            // Dispara evento para sincronizar outras abas
            window.dispatchEvent(new StorageEvent('storage', {
                key,
                newValue: JSON.stringify(valueToStore),
            }));
        } catch (error) {
            console.warn(`Erro ao salvar localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Função para remover o valor
    const removeValue = useCallback(() => {
        try {
            localStorage.removeItem(key);
            setStoredValue(initialValue instanceof Function ? initialValue() : initialValue);
        } catch (error) {
            console.warn(`Erro ao remover localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Sincroniza entre abas
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key && event.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(event.newValue));
                } catch (error) {
                    console.warn(`Erro ao sincronizar localStorage key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue, removeValue];
}
