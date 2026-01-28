// Forced refresh
import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsData } from '../data/mockData';
import { generateSlug } from '../utils/slug';
import ProductCard from '../components/product/ProductCard';
import { useI18n } from '../hooks/useI18n';
import SEO from '../components/features/SEOComponent';
import { Home } from 'lucide-react';
import CategoryToolbar from '../components/CategoryToolbar';
import FilterSidebar from '../components/FilterSidebar';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../hooks/useFavorites';
import { useModal } from '../hooks/useModal';

export default function CategoryPage() {
    const { slug } = useParams();
    const { t } = useI18n();
    const { addToCart } = useCart();
    const { favorites, toggleFavorite } = useFavorites();
    const { openModal } = useModal();

    // State for Toolbar & Filters
    const [sortOption, setSortOption] = useState('relevance');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [filters, setFilters] = useState({
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

    const displayTitle = categoryName || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

    // Filter Logic
    const { filteredAndSortedProducts, availableColors, availableSizes, priceRange } = useMemo(() => {
        // 1. Base Category Filtering
        let result = productsData.filter(product => generateSlug(product.category) === slug);

        // Calculate available distinct options and price range based on current category
        const allSizes = new Set();
        const allColorsMap = new Map();
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        result.forEach(p => {
            // Sizes
            if (p.sizes) p.sizes.forEach(s => allSizes.add(s));
            // Colors
            if (p.colors) p.colors.forEach(c => allColorsMap.set(c.name, c));
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
            result = result.filter(p => p.sizes && p.sizes.some(s => filters.sizes.includes(s)));
        }

        if (filters.colors.length > 0) {
            result = result.filter(p => p.colors && p.colors.some(c => filters.colors.includes(c.name)));
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
            priceRange: { min: Math.floor(minPrice), max: Math.ceil(maxPrice) }
        };
    }, [slug, sortOption, filters]);

    // Check if category exists (conceptually)
    const hasCategoryProducts = productsData.some(p => generateSlug(p.category) === slug);

    if (!hasCategoryProducts) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <SEO
                    title={`${displayTitle} | Ly Vest`}
                    description={`Produtos da categoria ${displayTitle}`}
                />
                <h1 className="text-3xl font-bold text-slate-800 mb-4">{t('common.categoryNotFound') || 'Categoria nÃ£o encontrada'}</h1>
                <p className="text-slate-600 mb-8">{t('common.noProductsInCategory') || 'NÃ£o encontramos produtos nesta categoria.'}</p>
                <Link to="/" className="inline-flex items-center gap-2 text-lyvest-500 hover:text-lyvest-600 font-medium">
                    <Home className="w-5 h-5" />
                    {t('common.backToHome') || 'Voltar para o inÃ­cio'}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <SEO
                title={`${displayTitle} | Ly Vest`}
                description={`Confira nossa seleÃ§Ã£o de ${displayTitle}. Produtos exclusivos de moda feminina.`}
                product={filteredAndSortedProducts}
                type="category"
            />

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
                    availableColors={availableColors}
                    availableSizes={availableSizes}
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
                    availableColors={availableColors}
                    availableSizes={availableSizes}
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
                                onToggleFavorite={(e) => toggleFavorite(e, product.id)}
                                onAddToCart={(qty) => {
                                    addToCart({ ...product, qty: qty || 1 });
                                    openModal('addedToCart', { ...product, qty: qty || 1 });
                                }}
                                onQuickView={() => openModal('quickview', product)}
                            />
                        ))}

                        {filteredAndSortedProducts.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm p-10">
                                <span className="text-4xl mb-4 block">ðŸ”</span>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Nenhum produto encontrado</h3>
                                <p className="text-slate-500">Tente ajustar os filtros para encontrar o que procura.</p>
                                <button
                                    onClick={() => setFilters({ maxPrice: 1000, sizes: [], colors: [] })}
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








