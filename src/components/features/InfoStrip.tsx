import { CreditCard, Truck, Percent, Lock } from 'lucide-react';

// Server Component — sem 'use client', sem hooks, sem hydration delay.
// Textos em pt-BR hardcoded para evitar dependência do I18nContext
// (que forçaria 'use client' e causaria CLS por mismatch de min-height).

// All 4 items for desktop
const allItems = [
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

// Mobile: only the 2 most impactful items (user request)
const mobileItems = [allItems[0], allItems[2]]; // "Até 6x" + "10% desconto"

export default function InfoStrip() {
    return (
        <section className="bg-transparent py-4 md:py-6 -mt-4 md:-mt-12 relative z-20">
            <div className="container mx-auto px-4">

                {/* --- MOBILE VERSION: 2 cards side by side (less DOM, no scroll) --- */}
                <div className="mobile-only grid grid-cols-2 gap-3">
                    {mobileItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white shadow-sm border border-slate-100"
                            >
                                <div className="p-2 rounded-full bg-lyvest-50 shrink-0">
                                    <Icon className="w-4 h-4 text-lyvest-500" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-slate-800 font-bold text-xs leading-tight mb-0.5">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-500 text-[10px] leading-tight">
                                        {item.subtitle}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- DESKTOP VERSION: All 4 items (icon left, text right) --- */}
                <div className="desktop-only grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {allItems.map((item, index) => {
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
