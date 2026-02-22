// src/store/useI18nStore.ts
// Zustand store replacing I18nContext — no provider needed
import { create } from 'zustand';

import { I18N_CONFIG } from '../config/constants';
import { defaultTranslations, loadLocale, TranslationData } from '../data/translations';

const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = I18N_CONFIG;
const LOCALE_STORAGE_KEY = 'lyvest_locale';

interface I18nState {
    locale: string;
    locales: string[];
    currentTranslations: TranslationData;
    isRTL: boolean;
    _isHydrated: boolean;

    // Actions
    changeLocale: (newLocale: string) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    formatCurrency: (value: number) => string;
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
    formatNumber: (value: number) => string;
    getProductData: (productId: string | number, field: string) => unknown;
    _hydrate: () => void;
}

// Translation function implementation (shared between hydration states)
function translateKey(translations: TranslationData, key: string, params: Record<string, string | number> = {}): string {
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = (value as Record<string, unknown>)[k];
        } else {
            // Fallback to pt-BR
            value = defaultTranslations;
            for (const fallbackK of keys) {
                if (value && typeof value === 'object' && fallbackK in value) {
                    value = (value as Record<string, unknown>)[fallbackK];
                } else {
                    return key;
                }
            }
            break;
        }
    }

    if (typeof value === 'string') {
        return value.replace(/{(\w+)}/g, (_: string, paramName: string) => {
            return params[paramName] !== undefined ? String(params[paramName]) : `{${paramName}}`;
        });
    }

    return typeof value === 'string' ? value : key;
}

export const useI18nStore = create<I18nState>((set, get) => ({
    locale: DEFAULT_LOCALE,
    locales: SUPPORTED_LOCALES as unknown as string[],
    currentTranslations: defaultTranslations,
    isRTL: false,
    _isHydrated: false,

    _hydrate: () => {
        try {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
                if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved) && saved !== DEFAULT_LOCALE) {
                    loadLocale(saved).then((data) => {
                        const isRTL = saved === 'ar-SA';
                        set({ currentTranslations: data, locale: saved, isRTL, _isHydrated: true });
                        document.documentElement.lang = saved;
                        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
                    });
                } else {
                    set({ _isHydrated: true });
                }
            }
        } catch {
            set({ _isHydrated: true });
        }
    },

    changeLocale: (newLocale: string) => {
        if (!(SUPPORTED_LOCALES as readonly string[]).includes(newLocale)) return;
        if (newLocale === get().locale) return;

        loadLocale(newLocale).then((data) => {
            const isRTL = newLocale === 'ar-SA';
            set({ currentTranslations: data, locale: newLocale, isRTL });
            try {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
                    document.documentElement.lang = newLocale;
                    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
                    if (isRTL) {
                        document.documentElement.classList.add('rtl');
                    } else {
                        document.documentElement.classList.remove('rtl');
                    }
                }
            } catch { /* ignore */ }
        });
    },

    t: (key: string, params: Record<string, string | number> = {}) => {
        return translateKey(get().currentTranslations, key, params);
    },

    formatCurrency: (value: number) => {
        const locale = get().locale;
        if (locale === 'pt-BR') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        }
        const usdValue = value / 6;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue);
    },

    formatDate: (date: Date | string | number, options: Intl.DateTimeFormatOptions = {}) => {
        const dateObj = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(get().locale, {
            day: 'numeric', month: 'long', year: 'numeric', ...options,
        }).format(dateObj);
    },

    formatNumber: (value: number) => {
        return new Intl.NumberFormat(get().locale).format(value);
    },

    getProductData: (productId: string | number, field: string) => {
        const translationData = get().currentTranslations as Record<string, unknown>;
        const productData = (translationData?.productData as Record<string, unknown>)?.[productId];

        if (productData && field in (productData as Record<string, unknown>)) {
            return (productData as Record<string, unknown>)[field];
        }

        const fallbackTranslationData = defaultTranslations as Record<string, unknown>;
        const fallbackData = (fallbackTranslationData?.productData as Record<string, unknown>)?.[productId];

        if (fallbackData && typeof fallbackData === 'object' && field in fallbackData) {
            return (fallbackData as Record<string, unknown>)[field];
        }
        return null;
    },
}));

// Auto-hydrate on client
if (typeof window !== 'undefined') {
    // Hydrate I18n immediately (needed for text rendering)
    useI18nStore.getState()._hydrate();
}

// Backward-compatible hook alias
export const useI18n = useI18nStore;
