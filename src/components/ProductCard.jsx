import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Minus, Plus } from 'lucide-react';
import { generateSlug } from '../utils/slug';
import { useI18n } from '../hooks/useI18n';

const ProductCard = ({ product, isFavorite, onToggleFavorite, onAddToCart, onQuickView }) => {
    const { formatCurrency, getProductData, t } = useI18n();
    const [isImageLoaded, setIsImageLoaded] = React.useState(false);
    const [quantity, setQuantity] = useState(1);

    const productSlug = generateSlug(product.name);

    // Use translated data if available, fallback to original
    const productName = getProductData(product.id, 'name') || product.name;
    const productBadge = getProductData(product.id, 'badge') || product.badge;

    const handleIncrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity < 10) setQuantity(prev => prev + 1);
    };

    const handleDecrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(quantity);
    };

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative border border-slate-100 flex flex-col h-full will-change-transform hover:-translate-y-1 min-w-[260px] sm:min-w-0">
            {/* Badge (Mais Vendido / Novo) */}
            {productBadge && (
                <span className="absolute top-3 left-3 bg-lyvest-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full z-20 shadow-md animate-fade-in tracking-wider">
                    {productBadge}
                </span>
            )}

            {/* Botão de Favoritar (Coração) */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(e);
                }}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-lyvest-100/30 transition-colors z-20 group/heart touch-target"
                aria-label={isFavorite ? t('aria.removeFromFavorites') : t('aria.addToFavorites')}
            >
                <Heart
                    className={`w-5 h-5 transition-all duration-300 ${isFavorite ? 'fill-lyvest-500 text-lyvest-500 scale-110' : 'text-slate-400 group-hover/heart:text-lyvest-500'}`}
                />
            </button>

            {/* Link para página do produto */}
            <Link to={`/produto/${productSlug}`} className="block flex-1 flex flex-col">
                {/* Imagem do Produto + Overlay */}
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                    <img
                        src={product.image}
                        alt={productName}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setIsImageLoaded(true)}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/400x400/fce7f3/ec4899?text=' + encodeURIComponent(product.name.split(' ')[0]);
                        }}
                        className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out image-reveal ${isImageLoaded ? 'loaded' : ''}`}
                    />

                    {/* Overlay de Ações (Desktop) */}
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px]">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onQuickView && onQuickView();
                            }}
                            className="p-3 bg-white text-slate-700 rounded-full hover:bg-lyvest-500 hover:text-white transition-all duration-300 shadow-lg transform hover:scale-110 flex items-center justify-center"
                            title={t('aria.quickView')}
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-[#333333] mb-2 line-clamp-2 text-base group-hover:text-lyvest-500 transition-colors min-h-[3rem]">
                        {productName}
                    </h3>

                    <div className="mt-auto mb-4 text-center">
                        <span className="block text-2xl font-bold text-lyvest-500 mb-1">
                            {formatCurrency(product.price)}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center justify-center gap-1">
                            <span className="inline-block w-4 h-[1px] bg-slate-300"></span>
                            {t('products.installments', { installments: 12, amount: formatCurrency(product.price / 12) })}
                            <span className="inline-block w-4 h-[1px] bg-slate-300"></span>
                        </span>
                    </div>

                    {/* Ações: Quantidade e Botão Comprar */}
                    <div className="flex items-center gap-2 mt-2">
                        {/* Selector de Quantidade */}
                        <div className="flex items-center border border-slate-200 rounded-full h-10 bg-slate-50 px-1">
                            <button
                                onClick={handleDecrement}
                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-lyvest-500 transition-colors disabled:opacity-50"
                                disabled={quantity <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-slate-700">{quantity}</span>
                            <button
                                onClick={handleIncrement}
                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-lyvest-500 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Botão Comprar */}
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 h-10 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white font-bold rounded-full hover:brightness-90 transition-all shadow-sm hover:shadow-md active:scale-95 text-sm"
                        >
                            {t('products.buy')}
                        </button>
                    </div>
                </div>
            </Link>
        </div>
    );
}
export default React.memo(ProductCard);







