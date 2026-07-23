// Menu principal (header desktop + menu mobile) — "Início" fixo + uma entrada
// por categoria de TOPO vinda do banco (sincronizada do Bling via
// useCatalogStore), cada uma carregando suas subcategorias (children) para o
// mega-menu / accordion mobile. Substitui o array fixo que existia em
// src/data/siteData.tsx (mainMenu).
//
// Categorias sem tradução estática (nomes dinâmicos vindos do Bling) usam o
// próprio nome como label — nunca a chave de tradução crua.
import { useMemo } from 'react';

import { useCatalog } from '../store/useCatalogStore';

export interface MainMenuChild {
    label: string;
    action: string;
    category: string;
    categorySlug: string;
}

export interface MainMenuItem {
    label: string;
    action: string;
    category?: string;
    categorySlug?: string;
    children: MainMenuChild[];
}

export function useMainMenu(): MainMenuItem[] {
    const { categories } = useCatalog();

    return useMemo((): MainMenuItem[] => {
        const topLevel = categories.filter((c) => !c.parentId);
        const byParent = new Map<string, typeof categories>();
        for (const c of categories) {
            if (!c.parentId) continue;
            const arr = byParent.get(c.parentId) ?? [];
            arr.push(c);
            byParent.set(c.parentId, arr);
        }

        return [
            { label: 'Início', action: 'reset', children: [] },
            ...topLevel.map((c) => ({
                label: c.name,
                action: 'filter',
                category: c.name,
                categorySlug: c.slug,
                children: (byParent.get(c.id) ?? []).map((child) => ({
                    label: child.name,
                    action: 'filter',
                    category: child.name,
                    categorySlug: child.slug,
                })),
            })),
        ];
    }, [categories]);
}
