import React from 'react';
import { CreditCard, Truck, Percent, Lock } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

function InfoStrip() {
    const { t } = useI18n();

    const items = [
        {
            icon: <CreditCard className="w-8 h-8 text-lyvest-500" />,
            title: t('infoStrip.creditCard'),
            subtitle: t('infoStrip.installments')
        },
        {
            icon: <Truck className="w-8 h-8 text-lyvest-500" />,
            title: t('infoStrip.freeShipping'),
            subtitle: t('infoStrip.allBrazil')
        },
        {
            icon: <Percent className="w-8 h-8 text-lyvest-500" />,
            title: t('infoStrip.discount'),
            subtitle: t('infoStrip.boleto')
        },
        {
            icon: <Lock className="w-8 h-8 text-lyvest-500" />,
            title: t('infoStrip.secure'),
            subtitle: t('infoStrip.certified')
        }
    ];

    const [currentGroup, setCurrentGroup] = React.useState(0);

    // Agrupa itens em pares para o mobile (2 slides de 2 itens)
    const mobileGroups = [
        items.slice(0, 2),
        items.slice(2, 4)
    ];

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentGroup((prev) => (prev + 1) % mobileGroups.length);
        }, 3500);
        return () => clearInterval(timer);
    }, [mobileGroups.length]);

    return (
        <section className="bg-transparent py-6 -mt-6 md:-mt-12 relative z-20">
            <div className="container mx-auto px-4">

                {/* --- VERSÃO MOBILE: Carrossel com 2 itens por vez (texto esquerda, ícone direita) --- */}
                <div className="md:hidden relative flex flex-col items-center">
                    <div className="relative w-full overflow-hidden h-[72px]">
                        {mobileGroups.map((group, groupIndex) => (
                            <div
                                key={groupIndex}
                                className={`absolute inset-0 w-full grid grid-cols-2 gap-3 transition-all duration-500 ease-in-out ${groupIndex === currentGroup
                                    ? 'opacity-100 translate-x-0 z-10'
                                    : 'opacity-0 translate-x-10 -z-10'
                                    }`}
                            >
                                {group.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-white shadow-md border border-slate-100 h-full"
                                    >
                                        {/* Texto à esquerda */}
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="text-slate-800 font-bold text-xs leading-tight mb-0.5 truncate">
                                                {item.title}
                                            </h3>
                                            <p className="text-slate-500 text-[10px] leading-tight truncate">
                                                {item.subtitle}
                                            </p>
                                        </div>
                                        {/* Ícone à direita */}
                                        <div className="p-2 rounded-full bg-lyvest-100 shrink-0">
                                            {React.cloneElement(item.icon, { className: "w-6 h-6 text-lyvest-500" })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Dots do carrossel */}
                    <div className="flex justify-center gap-2 mt-3">
                        {mobileGroups.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentGroup(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentGroup ? 'bg-lyvest-500 w-6' : 'bg-lyvest-200 w-2'
                                    }`}
                                aria-label={`Ver grupo ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* --- VERSÃO DESKTOP: Layout original (ícone esquerda, texto direita) --- */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border border-transparent hover:border-lyvest-100/50 rounded-xl transition-all duration-300 hover:bg-white/40">
                            <div className="p-3 border border-lyvest-100 rounded-xl bg-white shadow-sm text-lyvest-500 shrink-0">
                                {item.icon}
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
                    ))}
                </div>

            </div>
        </section>
    );
}

export default React.memo(InfoStrip);
