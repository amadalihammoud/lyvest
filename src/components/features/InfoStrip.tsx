import { CreditCard, Truck, Percent, Lock } from 'lucide-react';

// Server Component — sem 'use client', sem hooks, sem hydration delay.
// Textos em pt-BR hardcoded para evitar dependência do I18nContext
// (que forçaria 'use client' e causaria CLS por mismatch de min-height).

const items = [
    {
        icon: CreditCard,
        title: 'Até 6x no Cartão de Crédito',
        subtitle: 'Parcele sem juros',
    },
    {
        icon: Truck,
        title: 'Frete Grátis',
        subtitle: 'Para todo o Brasil',
    },
    {
        icon: Percent,
        title: '10% de desconto',
        subtitle: 'À vista no boleto',
    },
    {
        icon: Lock,
        title: 'Compra 100% segura',
        subtitle: 'Loja certificada',
    },
];

export default function InfoStrip() {
    return (
        <section className="bg-transparent py-4 md:py-6 -mt-4 md:-mt-12 relative z-20">
            <div className="container mx-auto px-4">

                {/* --- MOBILE VERSION: Horizontal Scroll Snap (Zero JS) --- */}
                <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={index}
                                className="snap-center shrink-0 w-[85%] sm:w-[300px] flex items-center justify-between px-4 py-3 rounded-xl bg-white shadow-sm border border-slate-100"
                            >
                                {/* Text left */}
                                <div className="flex-1 min-w-0 pr-3">
                                    <h3 className="text-slate-800 font-bold text-sm leading-tight mb-0.5 truncate">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-tight truncate">
                                        {item.subtitle}
                                    </p>
                                </div>
                                {/* Icon right */}
                                <div className="p-2.5 rounded-full bg-lyvest-50 shrink-0">
                                    <Icon className="w-5 h-5 text-lyvest-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- DESKTOP VERSION: Original Layout (icon left, text right) --- */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex items-center gap-4 p-4 border border-transparent hover:border-lyvest-100/50 rounded-xl transition-all duration-300 hover:bg-white/40">
                                <div className="p-3 border border-lyvest-100 rounded-xl bg-white shadow-sm text-lyvest-500 shrink-0">
                                    <Icon className="w-8 h-8 text-lyvest-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-slate-700 font-bold text-base md:text-base lg:text-lg leading-tight mb-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm md:text-sm lg:text-base leading-tight">
                                        {item.subtitle}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}
