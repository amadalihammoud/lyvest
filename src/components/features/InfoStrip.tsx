import { Tag, Truck, Coins, RotateCcw } from 'lucide-react';

// Server Component — sem 'use client', sem hooks para máxima performance.
const infoItems = [
    {
        icon: Tag,
        text: '10% OFF* na primeira compra',
    },
    {
        icon: Truck,
        text: 'Frete grátis a partir de R$ 249*',
    },
    {
        icon: Coins,
        text: 'Ganhe 15% de cashback',
    },
    {
        icon: RotateCcw,
        text: 'Troca fácil e grátis*',
    },
];

export default function InfoStrip() {
    return (
        <section className="bg-[#F5EDE8] border-b border-[#EAD9D1]/60 py-3 relative z-20">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Mobile: Scroll horizontal suave com snap */}
                <div className="flex md:hidden overflow-x-auto scrollbar-hide items-center justify-between gap-6 py-0.5 px-1 snap-x">
                    {infoItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex items-center gap-2 shrink-0 snap-center">
                                <Icon className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={1.75} />
                                <span className="text-xs font-medium text-slate-800 whitespace-nowrap">
                                    {item.text}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop: Distribuído uniformemente em linha única */}
                <div className="hidden md:flex items-center justify-around gap-4">
                    {infoItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={1.75} />
                                <span className="text-xs lg:text-[13px] font-medium text-slate-800 whitespace-nowrap">
                                    {item.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

