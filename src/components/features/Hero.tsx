import { getImageProps } from 'next/image';
import Link from 'next/link';
// No icons needed


const slides = [
    {
        id: 1,
        desktopImage: "/assets/banners/banner-slide-1.webp",
        mobileImage: "/assets/banners/banner-slide-1-mobile.webp",
        alt: "O abraço do sol na sua pele - Coleção de Verão Ly Vest",
        href: "/?categoria=Calcinhas"
    },
    {
        id: 2,
        desktopImage: "/assets/banners/banner-slide-2.webp",
        mobileImage: "/assets/banners/banner-slide-2-mobile.webp",
        alt: "O conforto que te abraça todo dia - Essenciais sem costura",
        href: "/?categoria=Calcinhas"
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
                            className="flex overflow-x-auto scrollbar-hide w-full rounded-xl sm:rounded-3xl aspect-[4/3] sm:aspect-[1024/329] relative bg-white/5"
                        >
                            {slides.map((slide, index) => {
                                const mobileImage = slide.mobileImage;
                                const desktopImage = slide.desktopImage;
                                const isLcp = index === 0;

                                return (
                                    <Link
                                        key={slide.id}
                                        href={slide.href}
                                        className="w-full flex-shrink-0 relative overflow-hidden block cursor-pointer group/slide"
                                        aria-label={slide.alt}
                                        draggable={false}
                                    >
                                        <div className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover/slide:scale-[1.02]">
                                            {/* Art Direction with PURE HTML for LCP bypass Vercel Proxy */}
                                            {isLcp ? (
                                                <picture className="w-full h-full">
                                                    <source media="(max-width: 767px)" srcSet={mobileImage} />
                                                    <source media="(min-width: 768px)" srcSet={desktopImage} />
                                                    <img
                                                        src={desktopImage}
                                                        alt={slide.alt}
                                                        width={1400}
                                                        height={450}
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
                                                        props: { srcSet: mobileSrcSet },
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
                                                            {/* eslint-disable-next-line jsx-a11y/alt-text -- alt vem de desktopProps (getImageProps com common.alt = slide.alt) */}
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
                                        {/* Gradient & Text CTA Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-24 text-left z-10 select-none">
                                            <span className="text-lyvest-300 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest mb-1 sm:mb-2 block">
                                                {slide.id === 1 ? "Novidades" : "Essenciais"}
                                            </span>
                                            <h2 className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 sm:mb-4 max-w-[200px] sm:max-w-md md:max-w-xl leading-tight">
                                                {slide.id === 1 ? "Coleção de Verão" : "Sem Costura"}
                                            </h2>
                                            <p className="text-[10px] sm:text-sm md:text-base text-slate-200 mb-3 sm:mb-6 max-w-[250px] sm:max-w-xs md:max-w-md hidden xs:block">
                                                {slide.id === 1 ? "Sinta a leveza e a sensualidade das nossas novas peças." : "Conforto absoluto e caimento perfeito sob qualquer look."}
                                            </p>
                                            <div>
                                                <span className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-white text-lyvest-600 hover:bg-lyvest-50 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 shadow-md group-hover/slide:shadow-lg transform group-hover/slide:-translate-y-0.5">
                                                    {slide.id === 1 ? "Comprar Agora" : "Ver Coleção"}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
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







