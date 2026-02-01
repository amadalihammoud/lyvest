
import { Minus, Plus, Lock, Sparkles } from 'lucide-react';
// Use Product from services/ProductService instead of local definition
import { Product } from '../../services/ProductService';

interface ProductActionsProps {
    product: Product;
    quantity: number;
    setQuantity: (fn: (prev: number) => number) => void;
    onAddToCart: (product: any) => void; // Using any for now to match flexible usage, or Product
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

    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    return (
        <>
            {/* Buy Actions */}
            <div className="flex flex-row gap-4 mt-2">
                {/* Quantity */}
                <div className="flex items-center bg-slate-100 rounded-md h-12">
                    <button onClick={() => handleQuantityChange(-1)} className="px-4 h-full text-slate-500 hover:text-lyvest-600 transition-colors" type="button">
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-slate-800">{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)} className="px-4 h-full text-slate-500 hover:text-lyvest-600 transition-colors" type="button">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Buy Button */}
                <button
                    onClick={() => onAddToCart({ ...product, quantity })}
                    className="flex-1 bg-lyvest-600 text-white font-bold h-12 rounded-md hover:bg-lyvest-600 transition-colors shadow-md text-lg uppercase tracking-wide"
                >
                    {t('products.buy')}
                </button>
            </div>

            {/* Provador Virtual - Botão Premium */}
            {onOpenVirtualFitting && (
                <button
                    onClick={onOpenVirtualFitting}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold h-12 rounded-md hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center gap-2 group"
                >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="text-base">Encontre Seu Tamanho com IA</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </button>
            )}

            {/* Shipping Calculator */}
            <div className="mt-6">
                <h3 className="text-lyvest-600 font-bold text-sm mb-2">{t('products.shipping.title')}</h3>
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
