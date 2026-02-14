'use client';

import { useState, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '@/components/features/Hero';
import ProductCard from '@/components/product/ProductCard';
import InfoStrip from '@/components/features/InfoStrip';
import { productsData } from '@/data/mockData';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useModal } from '@/context/ModalContext';
import { Smile } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

// Lazy load below-the-fold components
const TestimonialsSection = lazy(() => import('@/components/features/TestimonialsSection'));
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
        <section id="products-grid" className="py-16 bg-[#F9F9F9] min-h-[600px]">
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
        <section className="py-16 bg-[#F9F9F9]">
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
    return (
        <>
            {/* Hero & Info Banner - Rendered Immediately (SSR) */}
            <div className="bg-gradient-to-b from-lyvest-500 via-[#A0303C] to-white">
                <Hero />
                <InfoStrip />
            </div>

            {/* Suspended Product Grid - Loading State only affects this part */}
            <Suspense fallback={<ProductGridSkeleton />}>
                <ProductShowcase />
            </Suspense>

            {/* Testimonials */}
            <Suspense fallback={<div className="h-64 bg-slate-50 animate-pulse" />}>
                <TestimonialsSection />
            </Suspense>

            {/* Newsletter */}
            <section className="py-20 bg-[#FDF5F5]">
                <div className="container mx-auto px-4 text-center max-w-2xl">
                    {/* Using simple text for static render, functionality loads in background */}
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
