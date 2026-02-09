'use client';
/* eslint-disable react-refresh/only-export-components */
// src/context/I18nContext.tsx
import { useState, useCallback, useMemo, useEffect, useContext, createContext, ReactNode } from 'react';
import { translations } from '../data/translations';
import { I18N_CONFIG } from '../config/constants';

interface I18nContextType {
    locale: string;
    locales: string[];
    changeLocale: (newLocale: string) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    formatCurrency: (value: number) => string;
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
    formatNumber: (value: number) => string;
    getProductData: (productId: string | number, field: string) => unknown;
    isRTL: boolean;
}

export const I18nContext = createContext<I18nContextType | null>(null);

// Locales suportados (agora vindo das constantes)
const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = I18N_CONFIG;
const LOCALE_STORAGE_KEY = 'lyvest_locale';

interface I18nProviderProps {
    children: ReactNode;
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
    // Inicializar com padrão - será atualizado no cliente via useEffect
    const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hidratar do localStorage apenas no cliente
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
                if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) {
                    setLocale(saved);
                }
            }
        } catch {
            // Falha silenciosa
        }
        setIsHydrated(true);
    }, []);

    // Persistir mudanças e configurar direção (RTL/LTR)
    useEffect(() => {
        // Só persistir após hidratação
        if (!isHydrated) return;

        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(LOCALE_STORAGE_KEY, locale);
                document.documentElement.lang = locale;

                // Configurar direção
                const isRTL = locale === 'ar-SA';
                document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

                // Adicionar classe para estilização específica se necessário
                if (isRTL) {
                    document.documentElement.classList.add('rtl');
                } else {
                    document.documentElement.classList.remove('rtl');
                }
            }
        } catch {
            // Falha silenciosa
        }
    }, [locale, isHydrated]);

    // Mudar idioma
    const changeLocale = useCallback((newLocale: string) => {
        if ((SUPPORTED_LOCALES as readonly string[]).includes(newLocale)) {
            setLocale(newLocale);
        }
    }, []);

    // Traduzir uma chave
    const t = useCallback((key: string, params: Record<string, string | number> = {}) => {
        const keys = key.split('.');
        // Usando 'any' temporariamente para permitir indexação dinâmica nas traduções
        let value: unknown = translations[locale as keyof typeof translations];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                // Fallback para pt-BR
                value = translations[DEFAULT_LOCALE as keyof typeof translations];
                for (const fallbackK of keys) {
                    if (value && typeof value === 'object' && fallbackK in value) {
                        value = (value as Record<string, unknown>)[fallbackK];
                    } else {
                        return key; // Retorna a chave se não encontrar
                    }
                }
                break;
            }
        }

        // Substituir parâmetros {param}
        if (typeof value === 'string') {
            return value.replace(/{(\w+)}/g, (_: string, paramName: string) => {
                return params[paramName] !== undefined ? String(params[paramName]) : `{${paramName}}`;
            });
        }

        return typeof value === 'string' ? value : key;
    }, [locale]);

    // Formatar moeda - BRL para pt-BR, USD convertido para outros
    // Taxa de conversão: 6 BRL = 1 USD
    const formatCurrency = useCallback((value: number) => {
        if (locale === 'pt-BR') {
            // Locale brasileiro: mostra em Reais
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(value);
        } else {
            // Outros locales: converte para USD (6 BRL = 1 USD)
            const usdValue = value / 6;
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(usdValue);
        }
    }, [locale]);

    // Formatar data no locale atual
    const formatDate = useCallback((date: Date | string | number, options: Intl.DateTimeFormatOptions = {}) => {
        const dateObj = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            ...options,
        }).format(dateObj);
    }, [locale]);

    // Formatar número
    const formatNumber = useCallback((value: number) => {
        return new Intl.NumberFormat(locale).format(value);
    }, [locale]);

    // Obter dados traduzidos de um produto por ID
    // Suporta tanto strings quanto objetos (como specs)
    const getProductData = useCallback((productId: string | number, field: string) => {
        // Tipagem 'any' para acesso dinâmico às traduções
        const translationData = translations[locale as keyof typeof translations] as Record<string, unknown>;
        const productData = (translationData?.productData as Record<string, unknown>)?.[productId];

        if (productData && field in (productData as Record<string, unknown>)) {
            return (productData as Record<string, unknown>)[field];
        }

        // Fallback para pt-BR
        const fallbackTranslationData = translations[DEFAULT_LOCALE as keyof typeof translations] as Record<string, unknown>;
        const fallbackData = (fallbackTranslationData?.productData as Record<string, unknown>)?.[productId];

        if (fallbackData && typeof fallbackData === 'object' && field in fallbackData) {
            return (fallbackData as Record<string, unknown>)[field];
        }
        return null;
    }, [locale]);

    const value = useMemo(() => ({
        locale,
        locales: SUPPORTED_LOCALES as unknown as string[],
        changeLocale,
        t,
        formatCurrency,
        formatDate,
        formatNumber,
        getProductData,
        isRTL: locale === 'ar-SA',
    }), [locale, changeLocale, t, formatCurrency, formatDate, formatNumber, getProductData]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};
