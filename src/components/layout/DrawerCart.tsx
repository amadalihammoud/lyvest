import React from 'react';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useCart } from '../../context/CartContext';

import { CartItem } from '../../context/CartContext';

interface DrawerCartProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    onRemoveFromCart: (id: number | string) => void;
    onCheckout: () => void;
}

function DrawerCart({ isOpen, onClose, cartItems, onRemoveFromCart, onCheckout }: DrawerCartProps) {
    const { t, formatCurrency, getProductData } = useI18n();
    const {
        cartTotal,
        couponCode,
        discount,
        discountAmount,
        finalTotal,
        applyCoupon,
        removeCoupon
    } = useCart();

    const [couponInput, setCouponInput] = React.useState('');
    const [couponMessage, setCouponMessage] = React.useState('');

    // Preencher input se já tiver cupom
    React.useEffect(() => {
        if (couponCode) {
            setCouponInput(couponCode);
            setCouponMessage('Cupom aplicado com sucesso!');
        } else {
            setCouponInput('');
            setCouponMessage('');
        }
    }, [couponCode]);

    const handleApplyCoupon = () => {
        const result = applyCoupon(couponInput);
        setCouponMessage(result.message);
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponInput('');
        setCouponMessage('');
    };

    const containerRef = React.useRef(null);
    useFocusTrap(isOpen);

    if (!isOpen) return null;

    return (
        <div ref={containerRef} className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            {/* Content */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-6 flex items-center justify-between bg-lyvest-500">
                    <h2 id="cart-title" className="text-xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-white" /> {t('cart.title')}
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-full transition-colors text-white touch-target close-btn-mobile" aria-label={t('common.close')}>
                        <X className="w-7 h-7" />
                    </button>
                </div>


                <div className="flex-1 overflow-y-auto p-6">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center opacity-60">
                            <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
                            <p className="text-lg font-medium">{t('cart.empty')}</p>
                            <p className="text-sm">{t('cart.emptyMessage')}</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="flex gap-4 items-center animate-fade-in mb-4">
                                <img src={item.image} srcSet={`${item.image}?w=200 200w, ${item.image}?w=400 400w`} alt={(getProductData(item.id, 'name') as string) || item.name} className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{(getProductData(item.id, 'name') as string) || item.name}</h4>
                                    <p className="text-xs text-lyvest-500 font-medium mb-1">{String(getProductData(item.id, 'category') || item.category)}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-semibold text-lyvest-500">
                                            {item.qty}x {formatCurrency(item.price)}
                                        </span>
                                        <button onClick={() => onRemoveFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1" aria-label={t('cart.remove')}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    {/* Coupon Input */}
                    <div className="mb-6">
                        <label htmlFor="coupon" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                            {t('cart.coupon') || 'Cupom de Desconto'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="coupon"
                                type="text"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                placeholder="Ex: BEMVINDA10"
                                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:border-lyvest-500 focus:outline-none uppercase"
                                disabled={!!couponCode}
                            />
                            {couponCode ? (
                                <button
                                    onClick={handleRemoveCoupon}
                                    className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleApplyCoupon}
                                    className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    Aplicar
                                </button>
                            )}
                        </div>
                        {couponMessage && (
                            <p className={`text-xs mt-2 font-medium ${couponMessage.includes('aplicado') ? 'text-green-600' : 'text-red-500'}`}>
                                {couponMessage}
                            </p>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-medium">
                                <span>Desconto ({discount * 100}%):</span>
                                <span>- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-bold text-lyvest-500 pt-2 border-t border-slate-200">
                            <span>Total:</span>
                            <span>{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    <button
                        onClick={onCheckout}
                        className="w-full py-4 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-[#F5E6E8] transition-all transform hover:-translate-y-0.5"
                    >
                        {t('cart.checkout')}
                    </button>
                </div>
            </div>
        </div>
    );
}
export default React.memo(DrawerCart);







