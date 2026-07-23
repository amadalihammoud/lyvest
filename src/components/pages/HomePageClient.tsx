'use client';

import { Smile } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense, useRef } from 'react';

// Hero and InfoStrip moved to page.tsx for LCP optimization
// import Hero from '@/components/features/Hero';
import ProductCard from '@/components/product/ProductCard';
// import InfoStrip from '@/components/features/InfoStrip';
import { useCatalog } from '@/store/useCatalogStore';
import { useCart } from '@/store/useCartStore';
import { useFavorites } from '@/store/useFavoritesStore';
import { useI18n } from '@/store/useI18nStore';
import { useModal } from '@/store/useModalStore';


// Lazy load below-the-fold components — ssr: false to isolate heavy deps like Zod
const NewsletterForm = dynamic(() => import('@/components/features/NewsletterForm'), { ssr: false });
const Testimonials = dynamic(() => import('@/components/features/Testimonials'), { ssr: false });

// 1. Dynamic Component: Handles URL params and Product Grid
function ProductShowcase() {
    const router = useRouter();

    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');

    // Hydrate state from URL only on the client. 
    // This allows the server to statically generate the default 'Todos' 
    // product grid instantly in the initial HTML.
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- hidrata categoria/busca a partir da URL (client-only, SSR-safe) */
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const categoryParam = params.get('categoria');
            const searchParam = params.get('busca');
            if (categoryParam) setSelectedCategory(categoryParam);
            if (searchParam) setSearchQuery(searchParam);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, []);

    const { addToCart } = useCart();
    const { favorites, toggleFavorite } = useFavorites();
    const { openModal } = useModal();
    const { t } = useI18n();
    const { products: catalogProducts } = useCatalog();

    // Update URL when category/search changes (avoid loop by not depending on searchParams)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const params = new URLSearchParams();
        if (selectedCategory !== 'Todos') {
            params.set('categoria', selectedCategory);
        }

        if (searchQuery) {
            params.set('busca', searchQuery);
        }

        const newUrl = params.toString() ? `/?${params.toString()}` : '/';
        router.replace(newUrl, { scroll: false });
    }, [selectedCategory, searchQuery, router]);

    // Nome da categoria, independente do formato (string | {name,slug} | array) —
    // productos vindos do catálogo real (Neon) usam objeto, o mock usa string.
    const getProductCategoryName = (p: { category?: { name: string } | { name: string }[] | string }) => {
        if (!p.category) return '';
        if (typeof p.category === 'string') return p.category;
        if (Array.isArray(p.category)) return p.category[0]?.name ?? '';
        return p.category.name;
    };

    // Filter products
    const filteredProducts = useMemo(() => {
        let result = catalogProducts;
        if (selectedCategory !== 'Todos') {
            result = result.filter((p) => {
                const catName = getProductCategoryName(p);
                if (selectedCategory === 'Marcadores') return catName === 'Marcadores de Livro';
                if (selectedCategory === 'Casa') return catName === 'Artigos para Casa';
                return catName === selectedCategory;
            });
        }
        if (searchQuery.trim() !== '') {
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return result;
    }, [selectedCategory, searchQuery, catalogProducts]);

    // Category mapping for translation
    const getCategoryTranslation = (cat: string) => {
        const map: Record<string, string> = {
            'Todos': 'all',
            'Calcinha': 'panties',
            'Sutiã': 'bras',
            'Cueca': 'boxers',
            'Meia': 'socks',
            'Kits': 'kits',
            'Pijamas': 'pajamas'
        };
        const key = map[cat] || cat.toLowerCase();
        return t(`products.categories.${key}`) || cat;
    };

    return (
        <section id="products-grid" className="pt-4 pb-16 md:pt-8 bg-transparent min-h-[600px]">
            <div className="container mx-auto px-4">
                {/* Header da Seção */}
                <div className="text-center mb-10 md:mb-12">
                    <h2 className="text-[31px] md:text-5xl font-cookie text-lyvest-500 mb-2 md:mb-4 relative inline-block animate-fade-in"
                        style={{ textShadow: "3px 3px 0px rgba(253, 226, 243, 1)" }}
                    >
                        {searchQuery
                            ? t('home.searchTitle', { query: searchQuery })
                            : selectedCategory === 'Todos'
                                ? t('home.weekHighlights')
                                : getCategoryTranslation(selectedCategory)}
                    </h2>
                    {/* Elemento decorativo subtil (opcional) */}
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#C05060] to-transparent mx-auto mt-2 rounded-full opacity-60"></div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-slate-600 animate-fade-in">
                        <div className="bg-white inline-block p-6 rounded-full mb-4 shadow-sm">
                            <Smile className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-xl font-medium text-slate-700">{t('home.noResultsTitle')}</p>
                        <p className="text-sm mt-2">{t('home.noResultsDesc')}</p>
                        <button
                            onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); }}
                            className="mt-6 text-lyvest-500 font-bold hover:underline"
                        >
                            {t('home.viewAll')}
                        </button>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 lg:gap-8 overscroll-x-contain scroll-smooth snap-x snap-mandatory sm:pb-0 sm:mx-0 sm:px-0 scrollbar-hide">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                isFavorite={favorites.includes(product.id)}
                                onToggleFavorite={(e: React.MouseEvent) => toggleFavorite(e, product.id)}
                                onAddToCart={(qty: number) => {
                                    const cartProduct = { ...product, category: getProductCategoryName(product), qty: qty || 1 };
                                    addToCart(cartProduct);
                                    openModal('addedToCart', cartProduct);
                                }}
                                onQuickView={() => openModal('quickview', product)}
                            />
                        ))}
                    </div>
                )
                }
            </div >
        </section >
    );
}

// 3. Main Component: Renders Static Parts
export default function HomePageClient() {
    return (
        <>
            {/* Static Product Grid - Instantly parsed from HTML */}
            <ProductShowcase />

            {/* Testimonials moved here with ssr: false for JS diet */}
            <div className="cv-auto-sm">
                <Suspense fallback={<div className="h-64 bg-sky-50/30" />}>
                    <Testimonials />
                </Suspense>
            </div>
        </>
    );
}

// 4. Newsletter — rendered as a full-bleed section outside the page's centered
// container (see src/app/page.tsx), so the brand-colored band spans edge to edge.
export function NewsletterSection() {
    const { t } = useI18n();

    return (
        <section className="bg-lyvest-500 cv-auto-sm">
            <div className="container mx-auto px-4 py-8 md:py-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Left: heading + subtitle */}
                    <div className="text-center md:text-left flex-shrink-0">
                        <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide text-white">
                            {t('newsletter.title')}
                        </h2>
                        <p className="text-white/80 text-sm md:text-base">
                            {t('newsletter.subtitle')}
                        </p>
                    </div>

                    {/* Right: form */}
                    <div className="w-full md:max-w-xl">
                        <Suspense fallback={<div className="h-12 w-full bg-white/20 rounded-full animate-pulse" />}>
                            <NewsletterForm />
                        </Suspense>
                    </div>
                </div>
            </div>
        </section>
    );
}
