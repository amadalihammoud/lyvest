import { ShoppingBag } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { CartItem } from '../../context/CartContext';

interface CheckoutSummaryProps {
    cartItems: CartItem[];
    total: number;
}

export default function CheckoutSummary({ cartItems, total }: CheckoutSummaryProps) {
    const { t, formatCurrency, getProductData } = useI18n();
    const shipping = 0; // Frete grátis por padrão

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-fade-in h-full flex flex-col justify-between">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-lyvest-500" /> {t('checkout.summary.title')}
            </h3>

            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 pt-4 custom-scrollbar">
                {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                        <div className="relative">
                            <img src={item.image} alt={(getProductData(item.id, 'name') as string) || item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-50 border border-slate-100" />
                            <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {item.qty}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-700 line-clamp-2">{(getProductData(item.id, 'name') as string) || item.name}</h4>
                            <p className="text-xs text-sky-500 font-medium text-xs">{(getProductData(item.id, 'category') as string) || item.category}</p>
                            <p className="text-sm font-bold text-slate-800 mt-1">
                                {formatCurrency(item.price * item.qty)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>{t('cart.subtotal')}</span>
                    <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>{t('cart.shipping')}</span>
                    <span>{shipping === 0 ? t('cart.freeShipping') : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-100 mt-2">
                    <span>{t('cart.total')}</span>
                    <span>{formatCurrency(total)}</span>
                </div>
            </div>
        </div>
    );
}
