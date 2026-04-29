import { Heart, Eye, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { useI18n } from '../../hooks/useI18n';
import { Product } from '../../services/ProductService';
import { generateSlug } from '../../utils/slug';
import OptimizedProductImage from '../ui/OptimizedProductImage';

interface ProductCardProps {
    product: Product;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent) => void;
    onAddToCart: (quantity: number) => void;
    onQuickView?: () => void;
    priority?: boolean;
}

const ProductCard = ({ product, isFavorite, onToggleFavorite, onAddToCart, onQuickView, priority = false }: ProductCardProps) => {
    const { formatCurrency, getProductData, t } = useI18n();
    const [quantity, setQuantity] = useState(1);

    const productSlug = generateSlug(product.name);

    // Use translated data if available, fallback to original
    const productName = (getProductData(product.id, 'name') as string) || product.name;
    const productBadge = (getProductData(product.id, 'badge') as string) || product.badge;

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity < 10) setQuantity(prev => prev + 1);
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(quantity);
    };

    return (
        <div data-testid="product-card" className="group bg-white transition-[box-shadow,transform] duration-300 overflow-hidden relative border border-foreground/8 hover:border-foreground/20 hover:shadow-md flex flex-col h-full min-w-[260px] sm:min-w-0">
            {/* Badge (Mais Vendido / Novo) */}
            {productBadge && (
                <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[9px] uppercase font-medium px-2.5 py-1 z-20 animate-fade-in tracking-[0.2em]">
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
            <Link href={`/produto/${productSlug}`} className="flex-1 flex flex-col h-full w-full">
                {/* Imagem do Produto + Overlay */}
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                    <OptimizedProductImage
                        src={product.image}
                        alt={productName}
                        fill
                        priority={priority}
                        sizes="(max-width: 640px) 260px, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        fallbackText={product.name.split(' ')[0]}
                    />

                    {/* Overlay de Ações (Desktop) */}
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px]">
                        <button
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (onQuickView) {
                                    onQuickView();
                                }
                            }}
                            className="p-3 bg-white text-slate-700 rounded-full hover:bg-lyvest-500 hover:text-white transition-all duration-300 shadow-lg transform hover:scale-110 flex items-center justify-center"
                            aria-label={t('aria.quickView')}
                            title={t('aria.quickView')}
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-serif text-lg leading-tight text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem]">
                        {productName}
                    </h3>

                    <div className="mt-auto mb-4">
                        <span className="block text-xl font-medium text-foreground mb-1">
                            {formatCurrency(product.price)}
                        </span>
                        <span className="text-[11px] text-muted-foreground tracking-wide">
                            {t('products.installments', { installments: 12, amount: formatCurrency(product.price / 12) })}
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
                                aria-label={t('aria.decreaseQuantity')}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-slate-700">{quantity}</span>
                            <button
                                onClick={handleIncrement}
                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-lyvest-500 transition-colors"
                                aria-label={t('aria.increaseQuantity')}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Botão Comprar — sólido editorial */}
                        <button
                            data-testid="add-to-cart-button"
                            onClick={handleAddToCart}
                            className="flex-1 h-10 bg-primary text-primary-foreground font-medium tracking-[0.15em] uppercase text-[11px] hover:bg-lyvest-600 transition-colors active:scale-[0.98]"
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
