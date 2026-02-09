import React from 'react';
import { CheckCircle, Package, ArrowRight, Heart } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface OrderConfirmationProps {
    orderNumber: string | null;
    onContinueShopping: () => void;
}

export default function OrderConfirmation({ orderNumber, onContinueShopping }: OrderConfirmationProps) {
    const { t } = useI18n();

    React.useEffect(() => {
        // Lazy load canvas-confetti apenas quando necessário
        import('canvas-confetti').then((module) => {
            const confetti = module.default;

            // Disparar confetes ao montar o componente
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            // Cleanup
            return () => clearInterval(interval);
        });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 animate-scale-up text-center max-w-lg mx-auto">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-100 animate-bounce-in">
                <CheckCircle className="w-12 h-12 text-green-500" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 font-display">{t('checkout.confirmation.title')} 🎉</h1>
            <p className="text-lg text-slate-600 mb-8">
                {t('checkout.confirmation.thankYouMessage') || 'Obrigado por comprar na Ly Vest! Você receberá um e-mail com os detalhes do seu pedido.'}
            </p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full mb-8 text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C05060] to-sky-400"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('checkout.confirmation.orderNumberLabel') || 'Número do Pedido'}</p>
                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-800">#{orderNumber}</span>
                    <span className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <Package className="w-3 h-3" /> {t('tracking.status.processing')}
                    </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-sm text-slate-500">
                    <Heart className="w-4 h-4 text-[#C05060]" /> {t('checkout.confirmation.preparing') || 'Preparando com carinho'}
                </div>
            </div>

            <button
                onClick={onContinueShopping}
                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-lyvest-500 transition-all shadow-lg hover:shadow-[#E8C4C8] transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
            >
                {t('cart.continueShopping')} <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
}
