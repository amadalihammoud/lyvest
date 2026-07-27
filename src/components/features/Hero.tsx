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

            {/*
               Sem padding. Antes havia `pb-3 md:pb-0` + a classe
               .hero-mobile-compact (1rem em cima, 2rem embaixo, só no mobile).
               Como este bloco é transparente, aquele respiro virava duas faixas
               carmim — o bg-lyvest-500 do wrapper em app/page.tsx aparecendo por
               cima e por baixo do banner. O espaço de baixo existia para os
               pontinhos do carrossel, que ficavam FORA da imagem; agora eles
               vivem sobre ela.
            */}
            <div suppressHydrationWarning>
                <div className="flex justify-center items-center w-full">
                    <div className="w-full relative group">

                        {/*
                           CSS Scroll Snap Carousel — full-bleed, sem cantos arredondados
                           - Zero JS on load for LCP
                           - Native swiping experience
                           - Snap points for perfect alignment
                        */}
                        <div
                            className="flex overflow-x-auto scrollbar-hide w-full aspect-[4/3] sm:aspect-[1024/329] relative bg-white/5"
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
                                        {/* Sem overlay de texto: a copy (título/subtítulo/CTA) já vem
                                            desenhada na própria arte do banner. Overlay HTML duplicava o
                                            texto e ficava sobreposto — ver HANDOFF_NEON.md. O slide inteiro
                                            é o link; o zoom no hover sinaliza a interatividade. */}
                                    </Link>
                                );
                            })}
                        </div>

                        {/*
                           Indicador de múltiplos slides, agora SOBRE a imagem.

                           A cápsula escura translúcida não é enfeite: os pontos
                           pousam em cima da arte do banner, que muda a cada
                           slide e a cada campanha. Pontos brancos soltos somem
                           numa foto de areia clara; a cápsula garante contraste
                           independentemente do que o lojista subir depois.

                           `aria-hidden` porque isto é decoração: o carrossel é
                           CSS scroll-snap puro, sem JS, então os pontos não
                           acompanham a rolagem — anunciá-los a um leitor de tela
                           informaria uma posição que pode estar errada.
                        */}
                        <div
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 md:hidden flex items-center gap-2 z-20 pointer-events-none rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm"
                            aria-hidden="true"
                        >
                            <div className="w-5 h-1.5 rounded-full bg-white" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;







