
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productsData } from '@/data/mockData';
import { generateSlug } from '@/utils/slug';
import ProductCard from '@/components/product/ProductCard';
import { useI18n } from '@/context/I18nContext';

import { Home } from 'lucide-react';
import CategoryToolbar from '@/components/product/CategoryToolbar';
import FilterSidebar from '@/components/product/FilterSidebar';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useModal } from '@/context/ModalContext';

interface CategoryPageClientProps {
    slug: string;
}

export default function CategoryPageClient({ slug }: CategoryPageClientProps) {
    const { t } = useI18n();
    const { addToCart } = useCart();
    const { favorites, toggleFavorite } = useFavorites();
    const { openModal } = useModal();
    // router removed - was unused

    // State for Toolbar & Filters
    const [sortOption, setSortOption] = useState('relevance');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [filters, setFilters] = useState<{
        minPrice: number;
        maxPrice: number;
        sizes: string[];
        colors: string[];
    }>({
        minPrice: 0,
        maxPrice: 1000,
        sizes: [],
        colors: []
    });

    // Encontrar a categoria baseada no slug
    const categoryName = useMemo(() => {
        const product = productsData.find(p => generateSlug(p.category) === slug);
        return product ? product.category : null;
    }, [slug]);

    const displayTitle = categoryName || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ') : '');

    // Filter Logic
    const { filteredAndSortedProducts, availableColors, availableSizes, priceRange } = useMemo(() => {
        // 1. Base Category Filtering
        let result = (productsData as any[]).filter(product => generateSlug(product.category) === slug);

        // Calculate available distinct options and price range based on current category
        const allSizes = new Set<string>();
        const allColorsMap = new Map<string, any>();
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        result.forEach(p => {
            // Sizes
            if (p.sizes) p.sizes.forEach((s: string) => allSizes.add(s));
            // Colors
            if (p.colors) p.colors.forEach((c: { name: string }) => allColorsMap.set(c.name, c));
            // Prices
            if (p.price < minPrice) minPrice = p.price;
            if (p.price > maxPrice) maxPrice = p.price;
        });

        // 2. Apply Sidebar Filters
        // Price Range Filter
        if (filters.maxPrice < 1000 || filters.minPrice > 0) {
            result = result.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
        }

        if (filters.sizes.length > 0) {
            result = result.filter(p => p.sizes && p.sizes.some((s: string) => filters.sizes.includes(s)));
        }

        if (filters.colors.length > 0) {
            result = result.filter(p => p.colors && p.colors.some((c: { name: string }) => filters.colors.includes(c.name)));
        }

        // 3. Apply Sorting
        result = result.sort((a, b) => {
            switch (sortOption) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'name-asc': return a.name.localeCompare(b.name);
                default: return 0; // relevance
            }
        });

        return {
            filteredAndSortedProducts: result,
            availableColors: Array.from(allColorsMap.values()),
            availableSizes: Array.from(allSizes).sort(),
            priceRange: { min: Math.floor(minPrice === Infinity ? 0 : minPrice), max: Math.ceil(maxPrice === -Infinity ? 1000 : maxPrice) }
        };
    }, [slug, sortOption, filters]);

    // Check if category exists (conceptually)
    const hasCategoryProducts = productsData.some(p => generateSlug(p.category) === slug);

    if (!hasCategoryProducts) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">

                <h1 className="text-3xl font-bold text-slate-800 mb-4">{t('common.categoryNotFound') || 'Categoria não encontrada'}</h1>
                <p className="text-slate-600 mb-8">{t('common.noProductsInCategory') || 'Não encontramos produtos nesta categoria.'}</p>
                <Link href="/" className="inline-flex items-center gap-2 text-lyvest-500 hover:text-lyvest-600 font-medium">
                    <Home className="w-5 h-5" />
                    {t('common.backToHome') || 'Voltar para o início'}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">


            {/* Toolbar with Breadcrumbs integrated */}
            <CategoryToolbar
                categoryTitle={displayTitle}
                sortOption={sortOption}
                onSortChange={setSortOption}
                onOpenFilters={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Mobile Filter Panel - Dropdown below toolbar */}
            <div className="container mx-auto px-4 lg:hidden relative">
                <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    availableColors={availableColors as any}
                    availableSizes={availableSizes as any}
                    priceRange={priceRange.min === Infinity ? { min: 0, max: 1000 } : priceRange}
                    variant="mobile"
                />
            </div>

            <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">


                {/* Sidebar de Filtros */}
                <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    availableColors={availableColors as any}
                    availableSizes={availableSizes as any}
                    priceRange={priceRange.min === Infinity ? { min: 0, max: 1000 } : priceRange}
                />

                {/* Grid de Produtos */}
                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
                        {filteredAndSortedProducts.map(product => (
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

                        {filteredAndSortedProducts.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm p-10">
                                <span className="text-4xl mb-4 block">🔍</span>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Nenhum produto encontrado</h3>
                                <p className="text-slate-500">Tente ajustar os filtros para encontrar o que procura.</p>
                                <button
                                    onClick={() => setFilters({ minPrice: 0, maxPrice: 1000, sizes: [], colors: [] })}
                                    className="mt-4 text-lyvest-500 font-bold hover:underline"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
