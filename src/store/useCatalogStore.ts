// src/store/useCatalogStore.ts
// Cache client-side do catálogo (produtos + categorias), carregado uma vez de
// /api/products e /api/categories (que por sua vez leem o Neon — ver
// src/server/providers/catalog.ts). Substitui o import direto de
// src/data/products.ts (mock) nos componentes client-only (menu, chat,
// recomendação por IA, drawers, produtos relacionados).
import { useEffect } from 'react';
import { create } from 'zustand';

import { Product } from '../services/ProductService';

export interface CatalogCategory {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
}

interface CatalogState {
    products: Product[];
    categories: CatalogCategory[];
    loaded: boolean;
    loading: boolean;
    fetchCatalog: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
    products: [],
    categories: [],
    loaded: false,
    loading: false,
    fetchCatalog: async () => {
        if (get().loaded || get().loading) return;
        set({ loading: true });
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                fetch('/api/products').then((r) => r.json()),
                fetch('/api/categories').then((r) => r.json()),
            ]);
            set({
                products: productsRes.items ?? [],
                categories: categoriesRes.items ?? [],
                loaded: true,
                loading: false,
            });
        } catch (e) {
            console.error('useCatalogStore: falha ao carregar catálogo', e);
            set({ loading: false });
        }
    },
}));

/** Hook de conveniência: dispara o carregamento (uma vez) e retorna o estado atual. */
export function useCatalog() {
    const { products, categories, loaded, loading, fetchCatalog } = useCatalogStore();

    useEffect(() => {
        fetchCatalog();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchCatalog é estável (zustand) e já se protege contra chamadas duplicadas
    }, []);

    return { products, categories, loaded, loading };
}
