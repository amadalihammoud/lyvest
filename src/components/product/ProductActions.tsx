
import { Minus, Plus, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';

import SizeGuideModal from './SizeGuideModal';
// Use Product from services/ProductService instead of local definition
import { Product } from '../../services/ProductService';
import { buildSizeOptions, isFullyOutOfStock, requiresSizeSelection, resolveVariantId } from '../../utils/variantOptions';

interface ProductActionsProps {
    product: Product;
    quantity: number;
    setQuantity: (fn: (prev: number) => number) => void;
    onAddToCart: (product: Product) => void;
    onOpenVirtualFitting?: () => void;
    shippingZip: string;
    setShippingZip: (zip: string) => void;
    t: (key: string) => string;
    isRTL?: boolean;
}

export function ProductActions({
    product,
    quantity,
    setQuantity,
    onAddToCart,
    onOpenVirtualFitting,
    shippingZip,
    setShippingZip,
    t,
    isRTL = false
}: ProductActionsProps) {

    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [sizeError, setSizeError] = useState(false);

    const sizeOptions = useMemo(() => buildSizeOptions(product), [product]);
    const esgotado = isFullyOutOfStock(sizeOptions);

    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleSelectSize = (size: string) => {
        setSelectedSize(size);
        setSizeError(false);
    };

    const handleAddToCartClick = () => {
        if (requiresSizeSelection(sizeOptions) && !selectedSize) {
            // Antes era um alert() — bloqueante, sem acessibilidade e invisível
            // para quem usa leitor de tela. O erro agora fica ao lado do seletor.
            setSizeError(true);
            return;
        }

        // O variantId é o que create_order exige para produto com grade; sem ele
        // o pedido é recusado (VARIANT_REQUIRED) já no banco.
        onAddToCart({
            ...product,
            quantity,
            sizes: selectedSize ? [selectedSize] : undefined,
            variantId: resolveVariantId(sizeOptions, selectedSize),
        } as unknown as Product);
    };

    return (
        <>
            {/* Seletor de Tamanho */}
            {sizeOptions.length > 0 && (
                <div className="mt-4 mb-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700">Tamanho: {selectedSize || ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Escolha o tamanho">
                        {sizeOptions.map((opt) => (
                            <button
                                key={opt.size}
                                type="button"
                                onClick={() => handleSelectSize(opt.size)}
                                disabled={!opt.available}
                                aria-pressed={selectedSize === opt.size}
                                // Esgotado continua visível: sumir com ele faria a
                                // loja parecer nunca ter tido o tamanho.
                                title={opt.available ? undefined : 'Esgotado'}
                                className={`h-10 min-w-[3rem] px-3 border rounded-md font-medium text-sm transition-colors ${
                                    !opt.available
                                        ? 'border-slate-200 text-slate-300 line-through cursor-not-allowed'
                                        : selectedSize === opt.size
                                            ? 'border-lyvest-600 bg-lyvest-600 text-white'
                                            : 'border-slate-300 text-slate-700 hover:border-lyvest-500'
                                }`}
                            >
                                {opt.size}
                            </button>
                        ))}
                    </div>
                    {sizeError && (
                        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                            Selecione um tamanho antes de comprar.
                        </p>
                    )}
                </div>
            )}

            {/* Buy Actions */}
            <div className="flex flex-row gap-4 mt-4">
                {/* Quantity */}
                <div className="flex items-center bg-slate-100 rounded-md h-12">
                    <button aria-label="Diminuir quantidade" onClick={() => handleQuantityChange(-1)} className="px-4 h-full text-slate-500 hover:text-lyvest-600 transition-colors" type="button">
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-slate-800" aria-live="polite" aria-label={`Quantidade: ${quantity}`}>{quantity}</span>
                    <button aria-label="Aumentar quantidade" onClick={() => handleQuantityChange(1)} className="px-4 h-full text-slate-500 hover:text-lyvest-600 transition-colors" type="button">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Buy Button */}
                <button
                    data-testid="add-to-cart-button"
                    type="button"
                    onClick={handleAddToCartClick}
                    disabled={esgotado}
                    className={`px-8 font-bold h-12 rounded-md transition-colors shadow-md text-base uppercase tracking-wide flex-1 ${
                        esgotado
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-lyvest-600 text-white hover:bg-lyvest-700'
                    }`}
                >
                    {esgotado ? 'Esgotado' : t('products.buy')}
                </button>
            </div>

            {/* Dois botões lado a lado - estilo link */}
            <div className="flex gap-4 text-xs text-slate-500 mt-4 items-center">
                {onOpenVirtualFitting && (
                    <button
                        onClick={onOpenVirtualFitting}
                        className="flex items-center gap-1.5 hover:text-lyvest-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Descubra o seu tamanho</span>
                    </button>
                )}
                <button
                    onClick={() => setIsGuideOpen(true)}
                    className="flex items-center gap-1.5 hover:text-lyvest-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Guia de tamanhos</span>
                </button>
            </div>

            {/* Size Guide Modal */}
            <SizeGuideModal
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                category={typeof product.category === 'string' ? product.category.toLowerCase() : 'lingerie'}
            />

            {/* Shipping Calculator */}
            <div className="mt-6">
                <h2 className="text-lyvest-600 font-bold text-sm mb-2">{t('products.shipping.title')}</h2>
                <div className="flex gap-2 max-w-md">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={shippingZip}
                            onChange={(e) => setShippingZip(e.target.value)}
                            placeholder={t('products.shipping.placeholder')}
                            className={`w-full border border-slate-300 rounded-md ${isRTL ? 'pr-4 pl-10' : 'pl-4 pr-10'} py-2.5 outline-none focus:border-lyvest-500 transition-colors text-sm`}
                        />
                        <Lock className={`w-4 h-4 text-green-500 absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`} />
                    </div>
                    <button className="px-6 py-2.5 border border-slate-300 text-slate-500 font-bold text-xs uppercase rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors" type="button">
                        {t('products.shipping.calculate')}
                    </button>
                </div>
            </div>
        </>
    );
}
