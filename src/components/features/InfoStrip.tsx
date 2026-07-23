import { CreditCard, Truck, Percent, Package, ShieldCheck } from 'lucide-react';

// Server Component — sem 'use client', sem hooks, sem hydration delay.
// Textos em pt-BR hardcoded para evitar dependência do I18nContext
// (que forçaria 'use client' e causaria CLS por mismatch de min-height).

// 5 items for desktop (icon + title + subtitle)
const allItems = [
    {
        icon: Truck,
        title: 'Frete Grátis',
        subtitle: 'acima de R$299',
    },
    {
        icon: Percent,
        title: 'Descontos',
        subtitle: 'em pagamentos à vista',
    },
    {
        icon: Package,
        title: 'Entrega local',
        subtitle: 'receba hoje',
    },
    {
        icon: CreditCard,
        title: 'Pague com cartão',
        subtitle: 'em até 12x s/ juros',
    },
    {
        icon: ShieldCheck,
        title: 'Segurança',
        subtitle: 'Loja oficial',
    },
];

export default function InfoStrip() {
    return (
        <section className="bg-transparent -mt-4 md:-mt-12 relative z-20">
            {/* --- MOBILE VERSION: single simple line, brand colors --- */}
            <div className="md:hidden bg-lyvest-500 py-2 text-center">
                <p className="text-white text-xs font-bold uppercase tracking-wide">
                    Frete Grátis <span className="font-normal normal-case">acima de R$ 299</span>
                </p>
            </div>

            {/* --- DESKTOP VERSION: 5 items, icon left, text right (not clickable) --- */}
            <div className="hidden md:block container mx-auto px-4 py-6">
                <div className="grid grid-cols-5 gap-4">
                    {allItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex items-center gap-3">
                                <Icon className="w-6 h-6 text-lyvest-500 shrink-0" strokeWidth={1.75} />
                                <div className="text-left min-w-0">
                                    <h3 className="text-slate-800 font-bold text-sm leading-tight">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-tight truncate">
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
