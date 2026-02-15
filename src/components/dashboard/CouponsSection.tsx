import { useState } from 'react';
import { Ticket, Copy, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import Link from 'next/link';

interface Coupon {
    id: string;
    code: string;
    description: string;
    discountDetails: string; // e.g., "10% OFF" or "R$ 20,00"
    minPurchase?: string;
    expiry?: string;
    isActive: boolean;
    color: string;
}

export default function CouponsSection() {
    const { t } = useI18n();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const coupons: Coupon[] = [
        {
            id: '1',
            code: 'BEMVINDO10',
            description: 'Desconto especial para sua primeira compra',
            discountDetails: '10% OFF',
            isActive: true,
            color: 'bg-lyvest-500 text-white',
        },
        {
            id: '2',
            code: 'FRETEGRATIS',
            description: 'Frete grátis para todo o Brasil',
            discountDetails: 'Frete Grátis',
            minPurchase: 'Compras acima de R$ 299',
            isActive: true,
            color: 'bg-slate-800 text-white',
        },
        {
            id: '3',
            code: 'VIP20',
            description: 'Desconto exclusivo para clientes VIP',
            discountDetails: '20% OFF',
            expiry: 'Expira em 2 dias',
            isActive: true,
            color: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
        }
    ];

    const copyToClipboard = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                    <div className="p-2 bg-lyvest-100/30 rounded-full text-lyvest-500">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Meus Cupons</h3>
                        <p className="text-sm text-slate-500">Aproveite descontos exclusivos para você</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="relative group">
                            {/* Cupom Container */}
                            <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden flex flex-col sm:flex-row min-h-[160px] transition-transform hover:-translate-y-1 duration-300">
                                {/* Lado Esquerdo (Visual) */}
                                <div className={`${coupon.color} p-6 flex flex-col justify-center items-center text-center sm:w-1/3 relative overflow-hidden`}>
                                    {/* Efeito serrilhado (Circles) */}
                                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full z-10 hidden sm:block"></div>
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full z-10 sm:hidden"></div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full z-10 sm:hidden"></div>

                                    <div className="font-bold text-2xl mb-1">{coupon.discountDetails}</div>
                                    <div className="text-xs opacity-90 uppercase tracking-widest font-semibold">Cupom</div>
                                </div>

                                {/* Lado Direito (Info e Ação) */}
                                <div className="p-6 flex-1 flex flex-col justify-between border-l-2 border-dashed border-slate-100 sm:border-l-0 relative">
                                    {/* Serrilhado vertical para desktop */}
                                    <div className="hidden sm:block absolute -left-[2px] top-0 bottom-0 border-l-2 border-dashed border-slate-200"></div>

                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono font-bold text-lg text-slate-700 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                                {coupon.code}
                                            </span>
                                            {coupon.expiry && (
                                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full uppercase">
                                                    {coupon.expiry}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{coupon.description}</p>
                                        {coupon.minPurchase && (
                                            <p className="text-xs text-slate-400 italic mb-4">{coupon.minPurchase}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => copyToClipboard(coupon.code, coupon.id)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold transition-all border border-slate-200 hover:bg-slate-50 text-slate-600 active:scale-95"
                                        >
                                            {copiedId === coupon.id ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-green-600">Copiado!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copiar
                                                </>
                                            )}
                                        </button>
                                        <Link
                                            href="/"
                                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold bg-lyvest-50 text-lyvest-600 hover:bg-lyvest-100 transition-all"
                                        >
                                            Usar <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-lyvest-50 rounded-xl p-6 text-center">
                    <p className="text-lyvest-800 text-sm font-medium">
                        💡 Dica: Fique de olho no seu e-mail e WhatsApp para receber cupons relâmpago exclusivos!
                    </p>
                </div>
            </div>
        </div>
    );
}
