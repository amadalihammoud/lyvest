"use client";

import React from 'react';
import Image from 'next/image';
// No icons needed


const slides = [
    { id: 1, image: "/banner-slide-1.webp", alt: "O abraço do sol na sua pele - Coleção de Verão Ly Vest" },
    { id: 2, image: "/banner-slide-2.webp", alt: "O conforto que te abraça todo dia - Essenciais sem costura" }
];

function Hero() {

    const [currentSlide, setCurrentSlide] = React.useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative overflow-hidden bg-transparent text-white">
            {/* Blobs de fundo - Forçados LTR para evitar inversão estranha */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10" dir="ltr">
                <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-lyvest-100/40 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-sky-200/40 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            <div className="container mx-auto px-2 sm:px-4 pt-4 pb-8 lg:pt-4 lg:pb-20 hero-mobile-compact">
                <div className="flex justify-center items-center w-full">
                    <div className="w-[97%] sm:w-full max-w-[1400px] relative group">

                        {/* Carousel Slides - Altura aumentada em ~50% no mobile (aspect 1.67/1 vs 2.5/1) */}
                        <div className="relative aspect-[1.67/1] sm:h-[270px] md:h-[380px] lg:h-[450px] w-full">
                            {slides.map((slide, index) => (
                                <div
                                    key={slide.id}
                                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                        }`}
                                >
                                    <div className="relative h-full bg-white/40 backdrop-blur-sm p-1 sm:p-4 rounded-xl sm:rounded-3xl border border-white/50 shadow-xl overflow-hidden">
                                        <Image
                                            src={slide.image}
                                            alt={slide.alt}
                                            fill
                                            priority={index === 0} // Prioritize first slide LCP
                                            fetchPriority={index === 0 ? "high" : "auto"}
                                            className="rounded-lg sm:rounded-2xl object-cover shadow-sm"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Carousel Indicators (Dots) */}
                        <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-lyvest-600 w-6' : 'bg-lyvest-200 hover:bg-[#C05060]'
                                        }`}
                                    aria-label={`Ir para slide ${index + 1}`}
                                />
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}

export default React.memo(Hero);







