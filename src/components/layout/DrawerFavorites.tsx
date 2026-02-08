import React from 'react';
import { Heart, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '../../hooks/useI18n';
import { generateSlug } from '../../utils/slug';

import { useFocusTrap } from '../../hooks/useFocusTrap';

import { Product } from '../../services/ProductService';

interface DrawerFavoritesProps {
    isOpen: boolean;
    onClose: () => void;
    favoriteProducts: Product[];
    onAddToCart: (product: Product) => void;
    onToggleFavorite: (e: React.MouseEvent, id: number) => void;
    setNotification: (msg: string) => void;
}

function DrawerFavorites({ isOpen, onClose, favoriteProducts, onAddToCart, onToggleFavorite, setNotification }: DrawerFavoritesProps) {
    const { t, formatCurrency, getProductData } = useI18n();

    const containerRef = React.useRef(null);
    useFocusTrap(isOpen);

    if (!isOpen) return null;

    const addAllToCart = () => {
        favoriteProducts.forEach(p => onAddToCart(p));
        setNotification(t('products.addedToCart'));
    };

    return (
        <div ref={containerRef} className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="favorites-title">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            {/* Content */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-6 flex items-center justify-between bg-lyvest-500">
                    <h2 id="favorites-title" className="text-xl font-bold text-white flex items-center gap-2">
                        <Heart className="w-5 h-5 text-white" /> {t('favorites.title')}
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-full transition-colors text-white touch-target close-btn-mobile" aria-label={t('common.close')}>
                        <X className="w-7 h-7" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {favoriteProducts.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center opacity-60">
                            <Heart className="w-16 h-16 text-slate-300 mb-4" />
                            <p className="text-lg font-medium">{t('favorites.empty')}</p>
                            <p className="text-sm">{t('favorites.emptyMessage')}</p>
                        </div>
                    ) : (
                        favoriteProducts.map(item => (
                            <div key={item.id} className="flex gap-4 items-center animate-fade-in p-2 hover:bg-slate-50 rounded-xl transition-colors mb-2">
                                <Link href={`/produto/${generateSlug(item.name)}`} onClick={onClose} className="shrink-0">
                                    <img src={item.image} alt={(getProductData(item.id, 'name') as string) || item.name} className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100" />
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/produto/${generateSlug(item.name)}`} onClick={onClose}>
                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 hover:text-lyvest-500 transition-colors">
                                            {(getProductData(item.id, 'name') as string) || item.name}
                                        </h4>
                                    </Link>
                                    <p className="font-bold text-lyvest-500 text-sm">
                                        {formatCurrency(item.price)}
                                    </p>
                                    <button
                                        onClick={() => onAddToCart(item)}
                                        className="text-xs mt-2 px-3 py-1.5 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white rounded-full hover:shadow-md transition-all flex items-center gap-1 w-fit"
                                    >
                                        <ShoppingBag className="w-3 h-3" /> {t('products.addToCart')}
                                    </button>
                                </div>
                                <button onClick={(e) => onToggleFavorite(e, item.id)} className="text-lyvest-500 hover:text-lyvest-500 p-2">
                                    <Heart className="w-5 h-5 fill-lyvest-500" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {favoriteProducts.length > 0 && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50">
                        <button
                            onClick={addAllToCart}
                            className="w-full py-4 border border-lyvest-500 text-lyvest-500 font-bold rounded-full hover:bg-lyvest-100/30 transition-all"
                        >
                            {t('favorites.addAllToCart')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
export default React.memo(DrawerFavorites);







