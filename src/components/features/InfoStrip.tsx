import { Sparkles, RotateCcw, PackageOpen, MessageCircleHeart } from 'lucide-react';

// Benefícios alinhados ao posicionamento premium da marca,
// não os genéricos "6x sem juros / Frete grátis" que toda loja tem.
const items = [
    {
        icon: Sparkles,
        title: 'Tecidos selecionados',
        subtitle: 'Microfibra macia e algodão de toque suave',
    },
    {
        icon: RotateCcw,
        title: 'Troca em 30 dias',
        subtitle: 'Sem perguntas, sem complicação',
    },
    {
        icon: PackageOpen,
        title: 'Embalagem discreta',
        subtitle: 'Privacidade do envio à sua porta',
    },
    {
        icon: MessageCircleHeart,
        title: 'Atendimento humano',
        subtitle: 'Falamos com você pelo WhatsApp',
    },
];

// Mobile: 2 cards mais impactantes
const mobileItems = [items[0], items[1]];

export default function InfoStrip() {
    return (
        <section className="bg-background border-y border-foreground/10 mt-12 md:mt-20" aria-label="Diferenciais Lyvest">
            <div className="container mx-auto px-4">

                {/* MOBILE — 2 itens lado a lado, layout limpo sem cards pesados */}
                <div className="md:hidden grid grid-cols-2 divide-x divide-foreground/10 py-6">
                    {mobileItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="px-4 text-center">
                                <Icon className="w-5 h-5 text-primary mx-auto mb-2" aria-hidden="true" />
                                <h3 className="font-medium text-foreground text-xs leading-tight mb-1">
                                    {item.title}
                                </h3>
                                <p className="text-muted-foreground text-[10px] leading-snug">
                                    {item.subtitle}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* DESKTOP — 4 itens com divisores verticais editoriais */}
                <div className="hidden md:grid md:grid-cols-4 divide-x divide-foreground/10 py-10 lg:py-12">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex flex-col items-center text-center px-6">
                                <Icon className="w-6 h-6 text-primary mb-4" aria-hidden="true" strokeWidth={1.5} />
                                <h3 className="font-medium text-foreground text-sm tracking-wide uppercase mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">
                                    {item.subtitle}
                                </p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}
