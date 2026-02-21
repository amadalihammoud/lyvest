import { getImageProps } from 'next/image';
// No icons needed


const slides = [
    {
        id: 1,
        desktopImage: "/banner-slide-1.webp",
        mobileImage: "/banner-slide-1-mobile.webp",
        alt: "O abraço do sol na sua pele - Coleção de Verão Ly Vest"
    },
    {
        id: 2,
        desktopImage: "/banner-slide-2.webp",
        mobileImage: "/banner-slide-2-mobile.webp",
        alt: "O conforto que te abraça todo dia - Essenciais sem costura"
    }
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

            <div
                className="container mx-auto px-2 sm:px-4 pt-2 pb-6 lg:pt-4 lg:pb-20 hero-mobile-compact"
                suppressHydrationWarning
            >
                <div className="flex justify-center items-center w-full">
                    <div className="w-[97%] sm:w-full max-w-[1400px] relative group">

                        {/* 
                           CSS Scroll Snap Carousel 
                           - Zero JS on load for LCP
                           - Native swiping experience
                           - Snap points for perfect alignment
                        */}
                        <div
                            className="flex overflow-x-auto scrollbar-hide w-full rounded-xl sm:rounded-3xl aspect-[4/3] sm:aspect-[1024/329] relative bg-slate-100"
                        >
                            {slides.map((slide, index) => {
                                const mobileImage = slide.mobileImage;
                                const desktopImage = slide.desktopImage;
                                const isLcp = index === 0;

                                return (
                                    <div
                                        key={slide.id}
                                        className="w-full flex-shrink-0 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 w-full h-full">
                                            {/* Art Direction with PURE HTML for LCP bypass Vercel Proxy */}
                                            {isLcp ? (
                                                <picture className="w-full h-full">
                                                    <source media="(max-width: 767px)" srcSet={mobileImage} />
                                                    <source media="(min-width: 768px)" srcSet={desktopImage} />
                                                    <img
                                                        src={desktopImage}
                                                        alt={slide.alt}
                                                        fetchPriority="high"
                                                        decoding="sync"
                                                        loading="eager"
                                                        className="object-cover object-center w-full h-full"
                                                    />
                                                </picture>
                                            ) : (
                                                /* Fallback to Next.js Image for non-LCP (lazy loaded) */
                                                (() => {
                                                    const common = {
                                                        alt: slide.alt,
                                                        fill: true,
                                                        sizes: "(max-width: 767px) 100vw, (max-width: 1400px) calc(100vw - 64px), 1336px",
                                                        quality: 75,
                                                        priority: false,
                                                    };

                                                    const {
                                                        props: { srcSet: mobileSrcSet, ...mobileProps },
                                                    } = getImageProps({
                                                        ...common,
                                                        src: mobileImage,
                                                    });

                                                    const {
                                                        props: { srcSet: desktopSrcSet, ...desktopProps },
                                                    } = getImageProps({
                                                        ...common,
                                                        src: desktopImage,
                                                    });

                                                    return (
                                                        <picture className="w-full h-full">
                                                            <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
                                                            <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
                                                            <img
                                                                {...desktopProps}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="object-cover object-center w-full h-full"
                                                            />
                                                        </picture>
                                                    );
                                                })()
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 
                           Visual Indicator for Multi-slide 
                           (Pure CSS/Static - Optional: Add JS later if strict auto-play needed, 
                           but for LCP pure CSS is superior)
                        */}
                        <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 flex md:hidden space-x-2 z-20 pointer-events-none">
                            <div className="w-6 h-3 rounded-full bg-lyvest-600 transition-all opacity-80" />
                            <div className="w-3 h-3 rounded-full bg-lyvest-200 opacity-60" />
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;







