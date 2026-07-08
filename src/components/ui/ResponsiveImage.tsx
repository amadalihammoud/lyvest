// src/components/ResponsiveImage.tsx
import React, { useState, useRef, useEffect, ImgHTMLAttributes, CSSProperties } from 'react';

interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    containerClassName?: string;
    sizes?: string;
    widths?: number[];
    aspectRatio?: string | number | null;
    objectFit?: CSSProperties['objectFit'];
    priority?: boolean;
    fallbackSrc?: string | null;
}

// <img> principal extraído (mantém ResponsiveImage com baixa complexidade).
function ResponsiveImgEl({ src, srcSet, sizes, alt, priority, isLoaded, className, objectFit, onLoad, onError, extraProps }: {
    src: string;
    srcSet: string;
    sizes: string;
    alt: string;
    priority: boolean;
    isLoaded: boolean;
    className: string;
    objectFit: CSSProperties['objectFit'];
    onLoad: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    extraProps: ImgHTMLAttributes<HTMLImageElement>;
}) {
    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            // @ts-expect-error - fetchpriority is not yet in React types
            fetchpriority={priority ? 'high' : 'auto'}
            onLoad={onLoad}
            onError={onError}
            className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
            style={{ objectFit, width: '100%', height: '100%' }}
            {...extraProps}
        />
    );
}

// Fallback de erro extraído.
function ResponsiveImgFallback({ fallbackSrc, alt, className, objectFit }: {
    fallbackSrc: string | null;
    alt: string;
    className: string;
    objectFit: CSSProperties['objectFit'];
}) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
            {fallbackSrc ? (
                <img src={fallbackSrc} alt={alt} className={className} style={{ objectFit, width: '100%', height: '100%' }} />
            ) : (
                <>
                    <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span className="text-sm">Imagem indisponível</span>
                </>
            )}
        </div>
    );
}

/**
 * Componente de imagem responsiva com srcset, lazy loading e fallback
 * Otimizado para diferentes tamanhos de tela e densidades de pixel
 */
function ResponsiveImage({
    src,
    alt,
    className = '',
    containerClassName = '',
    sizes = '100vw',
    widths = [320, 640, 960, 1280],
    aspectRatio = null,
    objectFit = 'cover',
    priority = false,
    onLoad,
    onError,
    fallbackSrc = null,
    ...props
}: ResponsiveImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLDivElement>(null);

    // Intersection Observer para lazy loading
    useEffect(() => {
        if (priority || !imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '200px', // Começa a carregar 200px antes
                threshold: 0.01,
            }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, [priority]);

    // Gerar srcset
    const generateSrcSet = () => {
        if (!src) return '';

        // Se for uma URL externa, usar como está
        if (src.startsWith('http')) {
            return widths
                .map((w) => `${src}?w=${w} ${w}w`)
                .join(', ');
        }

        // Para imagens locais, usar o caminho direto
        // Em produção, você usaria um serviço de imagens
        return src;
    };

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoaded(true);
        onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setHasError(true);
        onError?.(e);
    };

    const containerStyle: CSSProperties = aspectRatio
        ? { aspectRatio: String(aspectRatio), position: 'relative' }
        : {};

    return (
        <div
            ref={imgRef}
            className={`overflow-hidden ${containerClassName}`}
            style={containerStyle}
        >
            {/* Skeleton placeholder */}
            {!isLoaded && !hasError && (
                <div
                    className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse"
                    style={{ animationDuration: '1.5s' }}
                />
            )}

            {/* Imagem principal */}
            {isInView && !hasError && (
                <ResponsiveImgEl
                    src={src}
                    srcSet={generateSrcSet()}
                    sizes={sizes}
                    alt={alt}
                    priority={priority}
                    isLoaded={isLoaded}
                    className={className}
                    objectFit={objectFit}
                    onLoad={handleLoad}
                    onError={handleError}
                    extraProps={props}
                />
            )}

            {/* Fallback em caso de erro */}
            {hasError && (
                <ResponsiveImgFallback fallbackSrc={fallbackSrc} alt={alt} className={className} objectFit={objectFit} />
            )}
        </div>
    );
}

export default React.memo(ResponsiveImage);
