import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import EmptyState from './EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { useCart } from '../../store/useCartStore';
import { useCatalog } from '../../store/useCatalogStore';
import { useFavorites } from '../../store/useFavoritesStore';
import { generateSlug } from '../../utils/slug';

/** Nome da categoria, independente do formato (string | objeto | array). */
function categoryName(p: { category?: { name: string } | { name: string }[] | string }): string {
    if (!p.category) return '';
    if (typeof p.category === 'string') return p.category;
    if (Array.isArray(p.category)) return p.category[0]?.name ?? '';
    return p.category.name;
}

export default function FavoritesSection() {
    const { t, formatCurrency } = useI18n();
    const { favorites, removeFavorite } = useFavorites();
    const { addToCart } = useCart();
    const { products } = useCatalog();

    // Catálogo REAL (useCatalogStore -> /api/products), não mais o mock
    // src/data/products.ts. Com o mock, o cliente via na lista de desejos
    // produtos que não existem — e os ids nem batiam: favoritos guardam uuid do
    // banco, enquanto o mock usa id numérico, então a lista aparecia vazia para
    // quem favoritou de verdade.
    const favoriteProducts = products.filter((p) => favorites.includes(p.id));

    if (favoriteProducts.length === 0) {
        return (
            <EmptyState
                icon={Heart}
                title={t('favorites.empty') || "Lista de desejos vazia"}
                message={t('favorites.emptyMessage') || "Você ainda não salvou nenhum item."}
                actionLabel={t('nav.home') || "Ver Produtos"}
                actionLink="/"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {favoriteProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="relative aspect-square bg-slate-50 overflow-hidden">
                        <Link href={`/produto/${product.slug ?? generateSlug(product.name)}`}>
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </Link>
                        <button
                            onClick={() => removeFavorite(product.id)}
                            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm text-lyvest-500 hover:bg-lyvest-100/30 transition-colors"
                            title={t('aria.removeFromFavorites') || "Remover"}
                        >
                            <Heart className="w-5 h-5 fill-current" />
                        </button>
                    </div>

                    <div className="p-4">
                        <Link href={`/produto/${product.slug ?? generateSlug(product.name)}`}>
                            <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 hover:text-lyvest-500 transition-colors">{product.name}</h3>
                        </Link>
                        <p className="font-bold text-lyvest-500 text-lg mb-4">{formatCurrency(product.price)}</p>

                        <button
                            // `category` no carrinho é string; no catálogo real vem como
                            // objeto {name, slug}. Mesmo tratamento já usado na home e na
                            // página de categoria.
                            onClick={() => addToCart({ ...product, category: categoryName(product), qty: 1 })}
                            className="w-full py-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-lyvest-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
                        >
                            <ShoppingBag className="w-4 h-4 text-slate-400 group-hover/btn:text-white" />
                            {t('products.addToCart') || "Adicionar"}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
