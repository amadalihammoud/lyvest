import React, { useState, useRef } from 'react';


const Testimonials = () => {
    // Mock user for "Ana Silva" matches the screenshot provided by user usually
    const testimonials = [
        {
            id: 1,
            name: "Ana Clara",
            occupation: "Estudante de Medicina",
            quote: "O Planner Bloom salvou o meu semestre! A qualidade do papel é incrível, posso usar as minhas canetas brush sem medo.",
            initials: "AC",
            color: "#A2D2FF" // Sky blue from screenshot
        },
        {
            id: 2,
            name: "Mariana Costa",
            occupation: "Designer",
            quote: "Adorei o design e os detalhes. Perfeito para presentear! A entrega foi super rápida.",
            initials: "MC",
            color: "#FFB7C5" // Pink
        },
        {
            id: 3,
            name: "Juliana Mendes",
            occupation: "Pediatra",
            quote: "Como médica, valorizo muito roupas de qualidade. Ly Vest superou minhas expectativas!",
            initials: "JM",
            color: "#FFA502" // Orange
        }
    ];

    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const width = scrollRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setActiveIndex(index);
        }
    };

    return (
        <section className="py-8 md:py-16 bg-sky-50/30">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-8 md:mb-12">
                    {/* Title optimized for mobile single line */}
                    <h2 className="text-[17px] md:text-3xl font-extrabold text-slate-800 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                        Quem comprou, amou! 💖
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base hidden md:block">
                        Veja o que nossos clientes estão dizendo sobre os produtos.
                    </p>
                    {/* Mobile subtitle if needed, or hide as per concise request */}
                    <p className="text-slate-500 text-xs md:hidden px-4">
                        Veja o que nossos clientes estão dizendo.
                    </p>
                </div>

                {/* Carousel Container */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 scrollbar-hide px-4 md:px-0 -mx-4 md:mx-0"
                >
                    {testimonials.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className="min-w-[85vw] md:min-w-0 snap-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300"
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-4 shadow-sm"
                                style={{ backgroundColor: testimonial.color }}
                            >
                                {testimonial.initials}
                            </div>

                            <p className="text-slate-600 italic mb-6 leading-relaxed flex-1 text-sm md:text-base">
                                "{testimonial.quote}"
                            </p>

                            <div className="mt-auto">
                                <h4 className="font-bold text-slate-800">{testimonial.name}</h4>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{testimonial.occupation}</p>
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







