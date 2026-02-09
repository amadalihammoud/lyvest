'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

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
 * Componente de imagem otimizado
 * - Fallback visual em caso de erro
 * - Skeleton loading animado
 * - Usa img nativo para compatibilidade máxima
 */
export default function OptimizedProductImage({
    src,
    alt,
    fill = false,
    className = '',
    priority = false,
    fallbackText,
}: OptimizedProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Gera texto para fallback baseado no alt
    const placeholderText = fallbackText || alt.split(' ')[0] || 'Produto';

    // Verifica se a imagem já está carregada (cache do browser)
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current?.naturalHeight > 0) {
            setIsLoading(false);
        }
    }, []);

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
                className={`${fill ? 'absolute inset-0' : 'w-full h-full'} bg-gradient-to-br from-lyvest-50 to-lyvest-100 flex items-center justify-center`}
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

    return (
        <>
            {/* Skeleton loading */}
            {isLoading && (
                <div
                    className={`${fill ? 'absolute inset-0' : 'absolute inset-0'} bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse z-10`}
                    aria-hidden="true"
                />
            )}

            {/* Imagem nativa com loading eager */}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={priority ? 'eager' : 'eager'} // Forcing eager to fix loading issues
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                className={`${fill ? 'absolute inset-0 w-full h-full object-cover' : 'w-full h-full object-cover'} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
            />
        </>
    );
}
