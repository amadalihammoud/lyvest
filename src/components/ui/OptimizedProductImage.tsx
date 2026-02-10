import Image from 'next/image';
import React, { useState, useCallback, useEffect } from 'react';

interface OptimizedProductImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    priority?: boolean;
    sizes?: string;
    fallbackText?: string;
}

/**
 * Componente de imagem otimizado (Next.js Image)
 * - Automaticamente serve WebP/AVIF
 * - Fallback visual em caso de erro
 * - Skeleton loading animado
 */
export default function OptimizedProductImage({
    src,
    alt,
    width,
    height,
    fill = false,
    className = '',
    priority = false,
    sizes,
    fallbackText,
}: OptimizedProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Gera texto para fallback baseado no alt
    const placeholderText = fallbackText || alt.split(' ')[0] || 'Produto';

    const handleLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
    }, []);

    // Se houve erro, mostra fallback
    if (hasError) {
        return (
            <div
                className={`${fill ? 'absolute inset-0' : 'w-full h-full'} bg-gradient-to-br from-lyvest-50 to-lyvest-100 flex items-center justify-center rounded-lg`}
                style={!fill && width && height ? { width, height } : undefined}
            >
                <div className="flex flex-col items-center justify-center text-lyvest-400 p-4 text-center">
                    <svg
                        className="w-12 h-12 mb-2 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span className="text-xs font-medium">{placeholderText}</span>
                </div>
            </div>
        );
    }

    // Prepare styles for loading state
    const styles = {
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoading ? 0 : 1,
    };

    return (
        <div className={`relative overflow-hidden ${!fill ? 'inline-block' : ''} ${className}`}>
            {/* Skeleton loading */}
            {isLoading && (
                <div
                    className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse z-10"
                    aria-hidden="true"
                />
            )}

            <Image
                src={src}
                alt={alt}
                width={!fill ? width : undefined}
                height={!fill ? height : undefined}
                fill={fill}
                priority={priority}
                sizes={sizes}
                onLoad={handleLoad}
                onError={handleError}
                className={`object-cover ${className}`} // Apply className to Image too for object-fit etc
                style={styles}
            />
        </div>
    );
}
