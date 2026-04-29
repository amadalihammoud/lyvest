'use client';
import { Star } from 'lucide-react';
import React from 'react';

const Testimonials = () => {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const cachedWidthRef = React.useRef<number>(0);

    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
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
            const width = cachedWidthRef.current || scrollRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setActiveIndex(index);
        }
    };

    const testimonials = [
        {
            id: 1,
            name: 'Mariana Silva',
            occupation: 'Cliente verificada',
            quote: 'As lingeries são maravilhosas, o tecido abraça o corpo e não marca absolutamente nada nas roupas. Já virei fã e recomendo para todas as amigas.',
            initials: 'MS',
        },
        {
            id: 2,
            name: 'Juliana Costa',
            occupation: 'Cliente verificada',
            quote: 'Apaixonada pelo conforto dos pijamas. Chegou super rápido e a embalagem é um capricho — dá para ver o carinho da Lyvest em cada detalhe.',
            initials: 'JC',
        },
        {
            id: 3,
            name: 'Carolina Mendes',
            occupation: 'Cliente verificada',
            quote: 'Como médica, valorizo muito qualidade no que vou usar o dia inteiro. A Lyvest superou minhas expectativas em conforto e acabamento.',
            initials: 'CM',
        },
    ];

    return (
        <section className="py-20 md:py-28 bg-background" aria-label="Depoimentos de clientes">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* ─── Header editorial ────────────────────────────────── */}
                <div className="text-center mb-12 md:mb-16">
                    <div className="flex items-center justify-center mb-5">
                        <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                        <span className="mx-4 text-[10px] md:text-[11px] font-medium tracking-[0.3em] uppercase text-primary">
                            Depoimentos
                        </span>
                        <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                    </div>
                    <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground tracking-tight text-balance">
                        Quem veste, <span className="italic text-primary">se apaixona.</span>
                    </h2>
                </div>

                {/* ─── Carousel de depoimentos ─────────────────────────── */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex md:grid md:grid-cols-3 items-stretch gap-6 md:gap-10 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 scrollbar-hide px-4 md:px-0 -mx-4 md:mx-0"
                >
                    {testimonials.map((testimonial) => (
                        <article
                            key={testimonial.id}
                            className="h-full min-h-[340px] md:min-h-[380px] min-w-[85vw] md:min-w-0 snap-center bg-muted/30 border border-foreground/5 px-7 py-9 md:px-9 md:py-11 flex flex-col text-left"
                        >
                            {/* Aspas decorativas serif */}
                            <span
                                aria-hidden="true"
                                className="font-serif italic text-7xl leading-none text-primary/30 select-none mb-2"
                            >
                                &ldquo;
                            </span>

                            <p className="font-serif text-lg md:text-xl text-foreground leading-relaxed flex-1 italic">
                                {testimonial.quote}
                            </p>

                            <div className="mt-8 pt-6 border-t border-foreground/10 flex items-center gap-4">
                                <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-xs font-medium tracking-wider text-primary bg-background">
                                    {testimonial.initials}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                        <Star className="w-3 h-3 fill-primary text-primary" aria-hidden="true" />
                                        {testimonial.occupation}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Indicadores mobile */}
                <div className="flex justify-center gap-1.5 mt-6 md:hidden" role="tablist">
                    {testimonials.map((_, index) => (
                        <span
                            key={index}
                            className={`h-[2px] transition-all duration-300 ${index === activeIndex ? 'w-8 bg-primary' : 'w-4 bg-foreground/20'}`}
                            role="tab"
                            aria-selected={index === activeIndex}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
