'use client';

import { useState, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Hero and InfoStrip moved to page.tsx for LCP optimization
// import Hero from '@/components/features/Hero';
import ProductCard from '@/components/product/ProductCard';
// import InfoStrip from '@/components/features/InfoStrip';
import { productsData } from '@/data/mockData';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useModal } from '@/context/ModalContext';
import { Smile } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

// Lazy load below-the-fold components
// TestimonialsSection moved to page.tsx
const NewsletterForm = lazy(() => import('@/components/features/NewsletterForm'));

// 1. Dynamic Component: Handles URL params and Product Grid
function ProductShowcase() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('categoria') || 'Todos';
    const searchParam = searchParams.get('busca') || '';

    const [selectedCategory, setSelectedCategory] = useState(categoryParam);
    const [searchQuery, setSearchQuery] = useState(searchParam);

    const { addToCart } = useCart();
    const { favorites, toggleFavorite } = useFavorites();
    const { openModal } = useModal();
    const { t } = useI18n();

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

    // Filter products
    const filteredProducts = useMemo(() => {
        let result = productsData;
        if (selectedCategory !== 'Todos') {
            result = result.filter((p) => {
                if (selectedCategory === 'Marcadores') return p.category === 'Marcadores de Livro';
                if (selectedCategory === 'Casa') return p.category === 'Artigos para Casa';
                return p.category === selectedCategory;
            });
        }
        if (searchQuery.trim() !== '') {
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return result;
    }, [selectedCategory, searchQuery]);

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
        <section id="products-grid" className="py-16 bg-transparent min-h-[600px]">
            <div className="container mx-auto px-4">
                {/* Header da Seção */}
                <div className="text-center mb-12">
                    <h2 className="text-[31px] md:text-5xl font-cookie text-lyvest-500 mb-4 relative inline-block animate-fade-in"
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
                    <div className="text-center py-20 text-slate-400 animate-fade-in">
                        <div className="bg-white inline-block p-6 rounded-full mb-4 shadow-sm">
                            <Smile className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-xl font-medium">{t('home.noResultsTitle')}</p>
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
                                    addToCart({ ...product, qty: qty || 1 });
                                    openModal('addedToCart', { ...product, qty: qty || 1 });
                                }}
                                onQuickView={() => openModal('quickview', product)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// 2. Updated Skeleton: Only for the Product Grid (Hero is visible)
function ProductGridSkeleton() {
    return (
        <section className="py-16 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <div className="h-12 w-64 bg-slate-200 rounded mx-auto"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl h-80 shadow-sm"></div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// 3. Main Component: Renders Static Parts + Suspended Dynamic Part
export default function HomePageClient() {
    const { t } = useI18n();

    return (
        <>
            {/* Hero & InfoStrip are now rendered in page.tsx for LCP optimization */}

            {/* Suspended Product Grid - Loading State only affects this part */}
            <Suspense fallback={<ProductGridSkeleton />}>
                <ProductShowcase />
            </Suspense>

            {/* Testimonials removed (rendered in page.tsx) */}

            {/* Newsletter — cv-auto-sm skips rendering until scrolled into view */}
            <section className="py-20 bg-[#FDF5F5] cv-auto-sm">
                <div className="container mx-auto px-4 text-center max-w-2xl">
                    {/* Newsletter heading */}
                    <h2 className="text-3xl md:text-4xl font-cookie text-lyvest-500 mb-3"
                        style={{ textShadow: "2px 2px 0px rgba(253, 226, 243, 1)" }}
                    >
                        {t('newsletter.title')}
                    </h2>
                    <p className="text-slate-600 mb-8 text-base md:text-lg">
                        {t('newsletter.subtitle')}
                    </p>
                    <div className="min-h-[200px]">
                        <Suspense fallback={<div className="h-12 w-full max-w-md mx-auto bg-slate-200 rounded-full animate-pulse" />}>
                            <NewsletterForm />
                        </Suspense>
                    </div>
                </div>
            </section>
        </>
    );
}
