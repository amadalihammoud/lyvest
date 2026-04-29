import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function Hero() {
    return (
        <section
            className="relative bg-background"
            aria-label="Coleção em destaque"
        >
            <div className="container mx-auto px-4 lg:px-8 pt-6 md:pt-8 lg:pt-10 pb-8 md:pb-10 lg:pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">

                    {/* ─── Coluna texto editorial (mais larga) ──────────── */}
                    <div className="lg:col-span-7 xl:col-span-7 order-2 lg:order-1 text-center lg:text-left">

                        {/* Eyebrow */}
                        <div className="flex items-center justify-center lg:justify-start mb-4 md:mb-5 animate-fade-in">
                            <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
                            <span className="mx-3 text-[10px] md:text-[11px] font-medium tracking-[0.3em] uppercase text-primary">
                                Coleção Verão 2026
                            </span>
                        </div>

                        {/* Headline serif */}
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-[4rem] font-light leading-[1.05] tracking-tight text-foreground text-balance animate-fade-up">
                            O abraço do sol
                            <span className="block italic text-primary mt-1">na sua pele.</span>
                        </h1>

                        {/* Sublinha */}
                        <p className="mt-5 md:mt-6 text-base md:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 text-pretty leading-relaxed">
                            Peças desenhadas para o conforto que você merece todo dia.
                            Tecidos selecionados, acabamento impecável.
                        </p>

                        {/* CTAs */}
                        <div className="mt-7 md:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
                            <Link
                                href="/?categoria=Calcinhas"
                                className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-lyvest-600 transition-colors"
                            >
                                Ver coleção
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                            <Link
                                href="#products-grid"
                                className="inline-flex items-center justify-center text-xs font-medium tracking-[0.2em] uppercase text-foreground px-8 py-4 border border-foreground/20 hover:border-foreground/60 transition-colors"
                            >
                                Em destaque
                            </Link>
                        </div>

                        {/* Trust bar editorial */}
                        <div className="mt-8 md:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <span className="text-primary text-base leading-none">★</span>
                                4.9 / 5 — +10 mil clientes
                            </span>
                            <span className="hidden sm:inline-block w-px h-4 bg-foreground/15" aria-hidden="true" />
                            <span>Entrega discreta</span>
                        </div>
                    </div>

                    {/* ─── Coluna imagem editorial ─────────────────────────── */}
                    <div className="lg:col-span-5 xl:col-span-5 order-1 lg:order-2 relative lg:flex lg:justify-end">
                        <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5] w-full lg:max-w-[380px] xl:max-w-[420px] max-h-[400px] lg:max-h-[520px] overflow-hidden bg-muted/40">
                            <Image
                                src="/assets/banners/hero-editorial.jpg"
                                alt="Coleção Lyvest verão 2026"
                                fill
                                priority
                                fetchPriority="high"
                                sizes="(max-width: 1024px) 100vw, 420px"
                                quality={85}
                                className="object-cover object-center"
                            />

                            {/* Selo editorial flutuante */}
                            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-background/95 backdrop-blur-sm px-4 py-3 md:px-5 md:py-4 max-w-[240px]">
                                <p className="font-serif italic text-base md:text-lg text-foreground leading-snug">
                                    &ldquo;Suave como uma carícia.&rdquo;
                                </p>
                                <p className="mt-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                                    Acabamento sem costura
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;
