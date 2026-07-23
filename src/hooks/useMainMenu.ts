// Menu principal (header desktop + menu mobile) — "Início" fixo + uma entrada
// por categoria vinda do banco (sincronizada do Bling via useCatalogStore).
// Substitui o array fixo que existia em src/data/siteData.tsx (mainMenu).
import { useMemo } from 'react';

import { useCatalog } from '../store/useCatalogStore';

export interface MainMenuItem {
    label: string;
    translationKey: string;
    action: string;
    category?: string;
    categorySlug?: string;
}

export function useMainMenu(): MainMenuItem[] {
    const { categories } = useCatalog();

    return useMemo((): MainMenuItem[] => [
        { label: 'Início', translationKey: 'nav.home', action: 'reset' },
        ...categories.map((c) => ({
            label: c.name,
            translationKey: `products.categories.${c.slug}`,
            action: 'filter',
            category: c.name,
            categorySlug: c.slug,
        })),
    ], [categories]);
}
