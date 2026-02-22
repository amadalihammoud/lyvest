import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import EmptyState from './EmptyState';
import { useCart } from '../../store/useCartStore';
import { useFavorites } from '../../context/FavoritesContext';
import { productsData } from '../../data/products';
import { useI18n } from '../../hooks/useI18n';
import { generateSlug } from '../../utils/slug';

export default function FavoritesSection() {
    const { t, formatCurrency } = useI18n();
    const { favorites, removeFavorite } = useFavorites();
    const { addToCart } = useCart();

    const favoriteProducts = productsData.filter(p => favorites.includes(p.id));

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
                        <Link href={`/produto/${generateSlug(product.name)}`}>
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
                        <Link href={`/produto/${generateSlug(product.name)}`}>
                            <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 hover:text-lyvest-500 transition-colors">{product.name}</h3>
                        </Link>
                        <p className="font-bold text-lyvest-500 text-lg mb-4">{formatCurrency(product.price)}</p>

                        <button
                            onClick={() => addToCart({ ...product, qty: 1 })}
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
