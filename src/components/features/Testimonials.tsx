'use client';
import { Quote, Star } from 'lucide-react';
import React from 'react';

import { useI18n } from '../../hooks/useI18n';

interface TestimonialItem {
    id: number;
    name: string;
    role: string;
    content: string;
    rating: number;
}

const Testimonials = () => {
    const { t } = useI18n();
    const [activeIndex, setActiveIndex] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    // Cache offsetWidth to avoid forced reflow on every scroll event.
    // ResizeObserver keeps this up-to-date whenever the container resizes.
    const cachedWidthRef = React.useRef<number>(0);

    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        // Seed initial value
        cachedWidthRef.current = el.offsetWidth;
        const ro = new ResizeObserver((entries) => {
            cachedWidthRef.current = entries[0]?.contentRect.width ?? el.offsetWidth;
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            // Use cached width — no forced reflow
            const width = cachedWidthRef.current || scrollRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setActiveIndex(index);
        }
    };

    const testimonials = [
        {
            id: 1,
            name: "Mariana Silva",
            occupation: "Cliente Verificada",
            quote: "As lingeries são maravilhosas, o tecido abraça o corpo e não marca absolutamente nada nas roupas. Já virei fã e recomendo para todas as amigas!",
            initials: "MS",
            color: "#A2D2FF" // Sky blue
        },
        {
            id: 2,
            name: "Juliana Costa",
            occupation: "Cliente Verificada",
            quote: "Simplesmente apaixonada pelo conforto dos pijamas! Chegou super rápido e a embalagem é um capricho, dá para ver o carinho da Ly Vest em cada detalhe.",
            initials: "JC",
            color: "#FFB7C5" // Pink
        },
        {
            id: 3,
            name: "Carolina Mendes",
            occupation: "Cliente Verificada",
            quote: "Como médica, valorizo muito roupas de qualidade. Ly Vest superou minhas expectativas!",
            initials: "CM",
            color: "#FFA502" // Orange
        }
    ];

    return (
        <section className="py-8 md:py-16 bg-[#F5EDE8]">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-[17px] md:text-3xl font-extrabold text-slate-800 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                        Quem comprou, amou! 💖
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base hidden md:block">
                        Veja o que nossos clientes estão dizendo sobre os produtos.
                    </p>
                    <p className="text-slate-700 text-xs md:hidden px-4">
                        Veja o que nossos clientes estão dizendo.
                    </p>
                </div>

                {/* Carousel Container */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex md:grid md:grid-cols-3 items-stretch gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 scrollbar-hide px-4 md:px-0 -mx-4 md:mx-0"
                >
                    {testimonials.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className="h-full min-h-[380px] md:min-h-[420px] min-w-[85vw] md:min-w-0 snap-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300"
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-slate-800 mb-4 shadow-sm"
                                style={{ backgroundColor: testimonial.color }}
                            >
                                {testimonial.initials}
                            </div>

                            <p className="text-slate-700 italic mb-6 leading-relaxed flex-1 text-sm md:text-base">
                                "{testimonial.quote}"
                            </p>

                            <div className="mt-auto">
                                <h3 className="font-bold text-slate-800">{testimonial.name}</h3>
                                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">{testimonial.occupation}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Indicators / Dots (Mobile Only) */}
                <div className="flex justify-center gap-2 mt-4 md:hidden">
                    {testimonials.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-6 bg-lyvest-500' : 'w-2 bg-slate-200'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
