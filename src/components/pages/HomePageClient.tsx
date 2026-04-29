'use client';

import { Smile } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense, useRef } from 'react';

import ProductCard from '@/components/product/ProductCard';
import { useCart } from '@/store/useCartStore';
import { useFavorites } from '@/store/useFavoritesStore';
import { useI18n } from '@/store/useI18nStore';
import { useModal } from '@/store/useModalStore';
import { productsData } from '@/data/products';

// Lazy load below-the-fold components
const NewsletterForm = dynamic(() => import('@/components/features/NewsletterForm'), { ssr: false });
const Testimonials = dynamic(() => import('@/components/features/Testimonials'), { ssr: false });

// 1. Product Showcase
function ProductShowcase() {
    const router = useRouter();

    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const categoryParam = params.get('categoria');
            const searchParam = params.get('busca');
            if (categoryParam) setSelectedCategory(categoryParam);
            if (searchParam) setSearchQuery(searchParam);
        }
    }, []);

    const { addToCart } = useCart();
    const { favorites, toggleFavorite } = useFavorites();
    const { openModal } = useModal();
    const { t } = useI18n();

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

    const sectionTitle = searchQuery
        ? t('home.searchTitle', { query: searchQuery })
        : selectedCategory === 'Todos'
            ? 'Em destaque'
            : getCategoryTranslation(selectedCategory);

    return (
        <section id="products-grid" className="pt-16 md:pt-24 pb-16 md:pb-24 bg-background min-h-[600px]">
            <div className="container mx-auto px-4">

                {/* ─── Header editorial da seção ──────────────────────── */}
                <div className="text-center mb-12 md:mb-16">
                    <div className="flex items-center justify-center mb-5">
                        <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                        <span className="mx-4 text-[10px] md:text-[11px] font-medium tracking-[0.3em] uppercase text-primary">
                            Lookbook
                        </span>
                        <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                    </div>
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight text-balance">
                        {sectionTitle}
                    </h2>
                    <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                        Selecionados pelo nosso time. Conforto e elegância no detalhe.
                    </p>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground animate-fade-in">
                        <div className="bg-muted/40 inline-block p-6 rounded-full mb-4">
                            <Smile className="w-12 h-12 text-muted-foreground/60" />
                        </div>
                        <p className="font-serif text-2xl text-foreground">{t('home.noResultsTitle')}</p>
                        <p className="text-sm mt-2">{t('home.noResultsDesc')}</p>
                        <button
                            onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); }}
                            className="mt-6 text-primary font-medium uppercase tracking-[0.18em] text-xs hover:underline underline-offset-4"
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

// 2. Main Component
export default function HomePageClient() {
    return (
        <>
            <ProductShowcase />

            {/* Testimonials */}
            <div className="cv-auto-sm">
                <Suspense fallback={<div className="h-64 bg-muted/20" />}>
                    <Testimonials />
                </Suspense>
            </div>

            {/* Newsletter editorial com cupom destacado */}
            <section className="py-20 md:py-28 bg-foreground text-background cv-auto-sm relative overflow-hidden">
                {/* Acento serif decorativo de fundo */}
                <span
                    aria-hidden="true"
                    className="font-serif italic text-[28rem] leading-none absolute -top-32 -right-20 text-primary/10 select-none pointer-events-none"
                >
                    Lyvest
                </span>

                <div className="container mx-auto px-4 text-center max-w-2xl relative">
                    <div className="flex items-center justify-center mb-5">
                        <span className="h-px w-8 bg-primary/60" aria-hidden="true" />
                        <span className="mx-4 text-[10px] md:text-[11px] font-medium tracking-[0.3em] uppercase text-primary">
                            Carta Lyvest
                        </span>
                        <span className="h-px w-8 bg-primary/60" aria-hidden="true" />
                    </div>

                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-balance">
                        Receba <span className="italic text-primary">10% off</span> na primeira compra.
                    </h2>
                    <p className="mt-4 mb-10 text-base md:text-lg text-background/70 max-w-md mx-auto">
                        Novidades, lançamentos e ofertas exclusivas direto no seu e-mail. Nada de spam.
                    </p>
                    <div className="min-h-[200px]">
                        <Suspense fallback={<div className="h-12 w-full max-w-md mx-auto bg-background/10 rounded-none animate-pulse" />}>
                            <NewsletterForm />
                        </Suspense>
                    </div>
                </div>
            </section>
        </>
    );
}
