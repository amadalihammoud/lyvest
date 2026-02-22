import { Ticket, Copy, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useI18n } from '../../hooks/useI18n';


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
            {/* Header com Ícone e Título */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-lyvest-100/30 rounded-full text-lyvest-500">
                    <Ticket className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Meus Cupons</h3>
                    <p className="text-sm text-slate-500">Aproveite descontos exclusivos para você</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className="relative group filter drop-shadow-sm hover:drop-shadow-md transition-all duration-300">
                        {/* Ticket Shape using mask or just borders */}
                        <div className="bg-white rounded-xl overflow-hidden flex min-h-[120px]">

                            {/* Left Side: Visual/Discount */}
                            <div className={`${coupon.color} w-32 flex flex-col items-center justify-center p-4 text-center relative`}>
                                {/* Serrated Edge Effect CSS would be ideal, but using simple dot overlay for now or border-style */}
                                <div className="absolute right-0 top-0 bottom-0 border-r-2 border-dashed border-white/20"></div>

                                <span className="font-bold text-xl leading-tight">{coupon.discountDetails}</span>
                                <span className="text-[10px] uppercase tracking-widest opacity-80 mt-1">OFF</span>
                            </div>

                            {/* Right Side: Info & Action */}
                            <div className="flex-1 p-4 flex flex-col justify-between relative bg-white">
                                {/* Semi-circle cutouts top/bottom for ticket effect */}
                                <div className="absolute -top-3 left-[0px] w-6 h-6 rounded-full bg-stone-50 md:bg-stone-50 z-10"></div>
                                <div className="absolute -bottom-3 left-[0px] w-6 h-6 rounded-full bg-stone-50 md:bg-stone-50 z-10"></div>

                                <div>
                                    <div className="flex justify-between items-start mb-1 pl-4">
                                        <div className="font-mono font-bold text-slate-700 text-lg tracking-wider">
                                            {coupon.code}
                                        </div>
                                        {coupon.expiry && (
                                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                                                {coupon.expiry}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 pl-4 mb-2 line-clamp-2">{coupon.description}</p>
                                </div>

                                <div className="flex gap-2 pl-4 mt-auto">
                                    <button
                                        onClick={() => copyToClipboard(coupon.code, coupon.id)}
                                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        {copiedId === coupon.id ? (
                                            <>
                                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                <span className="text-green-600">Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                Copiar
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href="/"
                                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-lyvest-50 text-lyvest-700 hover:bg-lyvest-100 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        Usar <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-lyvest-50/50 border border-lyvest-100 rounded-xl p-4 text-center">
                <p className="text-lyvest-800 text-sm font-medium flex items-center justify-center gap-2">
                    💡 <span className="opacity-80">Dica: Fique de olho no WhatsApp para receber cupons relâmpago!</span>
                </p>
            </div>
        </div>
    );
}
