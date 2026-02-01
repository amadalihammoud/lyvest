import { useModal } from '../../hooks/useModal';
import { useI18n } from '../../hooks/useI18n';
import { useCart } from '../../context/CartContext';
import { ArrowRight, Check, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FREE_SHIPPING_THRESHOLD = 350;

interface ModalData {
    image: string;
    name: string;
    price: number;
    qty?: number;
    quantity?: number;
}

/**
 * Modal shown after adding a product to cart
 */
export default function AddedToCartModal(): React.ReactElement | null {
    const { closeModal, modalData } = useModal();
    const { formatCurrency } = useI18n();
    const { cartTotal, cartCount } = useCart();
    const navigate = useNavigate();

    if (!modalData) return null;

    const typedModalData = modalData as ModalData;
    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
    const progress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);

    const handleCheckout = (): void => {
        closeModal();
        navigate('/checkout');
    };

    const limitText = (text: string, limit: number): string => {
        if (text.length <= limit) return text;
        return text.slice(0, limit) + '...';
    };

    return (
        <div className="p-0 overflow-hidden bg-white rounded-3xl w-full">
            {/* Header: Centered with exact symmetry */}
            <div className="pt-8 pb-6 flex items-center justify-center gap-3 animate-fade-in px-8 relative">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center animate-scale-up shadow-sm shrink-0">
                    <Check className="w-5 h-5 text-green-600 stroke-[3]" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none pt-0.5">
                    Produto adicionado ao carrinho!
                </h2>
            </div>

            <div className="px-8 pb-8">
                {/* Product Info Card - Cleaner Layout */}
                <div className="flex gap-5 items-center mb-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
                    <div className="w-20 h-20 bg-white rounded-xl p-1.5 flex-shrink-0 shadow-sm border border-slate-100 flex items-center justify-center">
                        <img
                            src={typedModalData.image}
                            alt={typedModalData.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-slate-800 line-clamp-1 mb-1.5 leading-tight tracking-tight">
                            {limitText(typedModalData.name, 45)}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="bg-white px-2.5 py-1 rounded-[6px] border border-slate-200/60 shadow-sm">
                                Qtd: <span className="font-bold text-slate-800">{typedModalData.qty || typedModalData.quantity || 1}</span>
                            </span>
                            <span className="opacity-30">|</span>
                            <span>Valor: <span className="font-bold text-slate-800">{formatCurrency(typedModalData.price)}</span></span>
                        </div>
                    </div>
                </div>

                {/* Subtotal Context - Symmetrical spacing */}
                <div className="flex justify-between items-end mb-6 px-1 text-slate-700">
                    <span className="text-[13px] font-medium text-slate-500 mb-0.5">Seu carrinho possui <strong className="text-slate-800">{cartCount} itens</strong></span>
                    <div className="text-right leading-none">
                        <span className="text-[11px] text-slate-400 block mb-1 uppercase tracking-wide font-bold">Subtotal</span>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(cartTotal)}</span>
                    </div>
                </div>

                {/* Free Shipping Gamification - Refined Gradient */}
                <div className="mb-6 bg-lyvest-100/30/40 rounded-xl p-4 border border-lyvest-100/60">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                        <div className="p-1.5 bg-lyvest-100 rounded-full text-lyvest-600">
                            <Truck className="w-4 h-4" />
                        </div>
                        {remainingForFreeShipping > 0 ? (
                            <span>
                                Faltam <span className="font-bold text-lyvest-600">{formatCurrency(remainingForFreeShipping)}</span> para ganhar <span className="text-green-600 font-bold uppercase text-xs tracking-wider">Frete Grátis</span>!
                            </span>
                        ) : (
                            <span className="text-green-600 font-bold">Parabéns! Você ganhou Frete Grátis! 🎉</span>
                        )}
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-lyvest-500 to-[#00C853] transition-all duration-1000 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleCheckout}
                        className="w-full py-3.5 bg-lyvest-500 text-white font-bold rounded-xl hover:bg-[#6a0b3d] hover:scale-[1.01] transition-all shadow-md flex items-center justify-center gap-2 group tracking-wide text-[16px]"
                    >
                        <span>Finalizar Compra</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={closeModal}
                        className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all text-[15px]"
                    >
                        Continuar Comprando
                    </button>
                </div>
            </div>
        </div>
    );
}
