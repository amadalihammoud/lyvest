import { ArrowRight } from 'lucide-react';
import { getImageProps } from 'next/image';
import Link from 'next/link';

const slides = [
    {
        id: 1,
        desktopImage: "/assets/banners/banner-slide-1.webp",
        mobileImage: "/assets/banners/banner-slide-1-mobile.webp",
        alt: "O abraço do sol na sua pele - Coleção de Verão Lyvest",
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
            className="relative bg-background pt-6 md:pt-10 lg:pt-14"
            aria-roledescription="carousel"
            aria-label="Banners promocionais"
        >
            <div className="container mx-auto px-4 lg:px-8">

                {/* ─── Eyebrow editorial ───────────────────────────────── */}
                <div className="flex items-center justify-center mb-6 md:mb-8 animate-fade-in">
                    <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                    <span className="mx-4 text-[10px] md:text-[11px] font-medium tracking-[0.3em] uppercase text-primary">
                        Coleção Verão 2026
                    </span>
                    <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                </div>

                {/* ─── Headline editorial serif ────────────────────────── */}
                <header className="max-w-4xl mx-auto text-center mb-8 md:mb-12 animate-fade-up">
                    <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.05] tracking-tight text-foreground text-balance">
                        O abraço do sol
                        <span className="block italic text-primary mt-1">na sua pele.</span>
                    </h1>
                    <p className="mt-5 md:mt-7 text-base md:text-lg text-muted-foreground max-w-xl mx-auto text-pretty leading-relaxed">
                        Peças desenhadas para o conforto que você merece todo dia. Tecidos selecionados, acabamento impecável.
                    </p>

                    <div className="mt-7 md:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <Link
                            href="/?categoria=Calcinhas"
                            className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 text-sm font-medium tracking-wide uppercase hover:bg-lyvest-600 transition-colors min-w-[220px]"
                        >
                            Ver coleção
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                        <Link
                            href="#products-grid"
                            className="inline-flex items-center justify-center text-sm font-medium tracking-wide uppercase text-foreground px-8 py-3.5 border border-foreground/20 hover:border-foreground/60 transition-colors min-w-[220px]"
                        >
                            Em destaque
                        </Link>
                    </div>
                </header>

                {/* ─── Carrossel de banners editoriais ─────────────────── */}
                <div className="flex justify-center items-center w-full">
                    <div className="w-full max-w-[1400px] relative group">
                        <div className="flex overflow-x-auto scrollbar-hide w-full aspect-[4/3] sm:aspect-[1024/329] relative bg-muted/40 rounded-sm">
                            {slides.map((slide, index) => {
                                const mobileImage = slide.mobileImage;
                                const desktopImage = slide.desktopImage;
                                const isLcp = index === 0;

                                return (
                                    <Link
                                        key={slide.id}
                                        href={slide.href}
                                        className="w-full flex-shrink-0 relative overflow-hidden block cursor-pointer group/slide snap-center"
                                        aria-label={slide.alt}
                                        draggable={false}
                                    >
                                        <div className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover/slide:scale-[1.02]">
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
                                                    } = getImageProps({ ...common, src: mobileImage });

                                                    const {
                                                        props: { srcSet: desktopSrcSet, ...desktopProps },
                                                    } = getImageProps({ ...common, src: desktopImage });

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
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Indicadores minimalistas */}
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex md:hidden gap-1.5 z-20 pointer-events-none">
                            <span className="block w-6 h-[2px] bg-primary" />
                            <span className="block w-6 h-[2px] bg-primary/25" />
                        </div>
                    </div>
                </div>

                {/* ─── Trust bar acima da dobra (prova social discreta) ─── */}
                <div className="mt-10 md:mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] md:text-xs tracking-[0.18em] uppercase text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <span className="text-primary text-base leading-none">★</span>
                        4.9 / 5 — +10 mil clientes
                    </span>
                    <span className="hidden sm:inline-block w-px h-4 bg-foreground/20" aria-hidden="true" />
                    <span>Frete grátis para todo o Brasil</span>
                    <span className="hidden sm:inline-block w-px h-4 bg-foreground/20" aria-hidden="true" />
                    <span>Embalagem discreta</span>
                </div>
            </div>
        </section>
    );
}

export default Hero;
