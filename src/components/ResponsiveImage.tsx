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
                <img
                    src={src}
                    srcSet={generateSrcSet()}
                    sizes={sizes}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding={priority ? 'sync' : 'async'}
                    // @ts-expect-error - fetchpriority is not yet in React types
                    fetchpriority={priority ? 'high' : 'auto'}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        } ${className}`}
                    style={{
                        objectFit: objectFit as CSSProperties['objectFit'],
                        width: '100%',
                        height: '100%',
                    }}
                    {...props}
                />
            )}

            {/* Fallback em caso de erro */}
            {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                    {fallbackSrc ? (
                        <img
                            src={fallbackSrc}
                            alt={alt}
                            className={className}
                            style={{ objectFit, width: '100%', height: '100%' }}
                        />
                    ) : (
                        <>
                            <svg
                                className="w-12 h-12 mb-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
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
            )}
        </div>
    );
}

export default React.memo(ResponsiveImage);
