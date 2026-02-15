"use client";

import React from 'react';
import Image from 'next/image';
// No icons needed


const slides = [
    { id: 1, image: "/banner-slide-1.webp", alt: "O abraço do sol na sua pele - Coleção de Verão Ly Vest" },
    { id: 2, image: "/banner-slide-2.webp", alt: "O conforto que te abraça todo dia - Essenciais sem costura" }
];

function Hero() {
    return (
        <section
            className="relative overflow-hidden bg-transparent text-white"
            aria-roledescription="carousel"
            aria-label="Banners promocionais"
        >
            {/* Blobs de fundo - Apenas Desktop para performance mobile */}
            <div className="hidden md:block absolute top-0 left-0 w-full h-full overflow-hidden -z-10" dir="ltr">
                <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-lyvest-100/40 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-sky-200/40 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            <div className="container mx-auto px-2 sm:px-4 pt-2 pb-6 lg:pt-4 lg:pb-20 hero-mobile-compact">
                <div className="flex justify-center items-center w-full">
                    <div className="w-[97%] sm:w-full max-w-[1400px] relative group">

                        {/* 
                           CSS Scroll Snap Carousel 
                           - Zero JS on load for LCP
                           - Native swiping experience
                           - Snap points for perfect alignment
                        */}
                        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[1.67/1] sm:h-[270px] md:h-[380px] lg:h-[450px] w-full rounded-xl sm:rounded-3xl">
                            {slides.map((slide, index) => (
                                <div
                                    key={slide.id}
                                    className="snap-center flex-shrink-0 w-full h-full relative"
                                >
                                    <div className="relative h-full w-full bg-white/40 backdrop-blur-sm p-1 sm:p-4 rounded-xl sm:rounded-3xl border border-white/50 shadow-xl overflow-hidden">
                                        <Image
                                            src={slide.image}
                                            alt={slide.alt}
                                            fill
                                            priority={index === 0}
                                            loading={index === 0 ? "eager" : "lazy"}
                                            fetchPriority={index === 0 ? "high" : "low"}
                                            className="rounded-lg sm:rounded-2xl object-cover shadow-sm"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 95vw, 1400px"
                                            placeholder="blur"
                                            blurDataURL="data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADwAQCdASoQAAoAAQAcJaQAA3AA/v3TAAA=" // Generic placeholder
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 
                           Visual Indicator for Multi-slide 
                           (Pure CSS/Static - Optional: Add JS later if strict auto-play needed, 
                           but for LCP pure CSS is superior)
                        */}
                        <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20 pointer-events-none">
                            <div className="w-6 h-3 rounded-full bg-lyvest-600 transition-all opacity-80" />
                            <div className="w-3 h-3 rounded-full bg-lyvest-200 opacity-60" />
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}

export default React.memo(Hero);







