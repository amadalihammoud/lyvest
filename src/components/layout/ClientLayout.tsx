'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense, useEffect } from 'react';

import AppProviders from '@/components/layout/AppProviders';

// Footer lazy loaded to reduce initial TBT
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
// AuthModal lazy loaded to remove Clerk/Framer from initial bundle
const AuthModalDeferred = dynamic(
    () => import('@/components/auth/AuthModal').then(mod => mod.default),
    { ssr: false }
);

// Strictly decouple LazyClerkProvider from the module graph until needed
// This prevents Next.js from sending the 200KB clerk.js chunk in the initial HTML
const LazyClerkProviderDeferred = dynamic(
    () => import('@/components/providers/LazyClerkProvider').then(mod => mod.LazyClerkProvider),
    { ssr: false }
);

import { useUltraLazyLoad } from '@/lib/ultra-lazy-load';
import { useAuthModal } from '@/store/useAuthModal';
import { initSentry } from '@/utils/sentry';

// Isolate FavoritesSync so Clerk is not pulled into the global bundle
const FavoritesSyncDeferred = dynamic(
    () => import('@/components/auth/FavoritesSync').then(mod => mod.FavoritesSync),
    { ssr: false }
);

interface ClientLayoutProps {
    children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const { isOpen } = useAuthModal();
    const shouldLoad = useUltraLazyLoad();

    // Defer Sentry initialization to idle callback (non-blocking)
    useEffect(() => {
        if (typeof window !== 'undefined' && shouldLoad) {
            // Sentry
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => initSentry(), { timeout: 5000 });
            } else {
                setTimeout(() => initSentry(), 1000);
            }

            // Register Service Worker for PWA / Caching
            if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    (err) => {
                        console.log('Service Worker registration failed: ', err);
                    }
                );
            }
        }
    }, [shouldLoad]);

    const childrenContent = (
        <AppProviders>
            <div className="flex flex-col min-h-screen">
                <main id="main-content" className="flex-grow">
                    {children}
                </main>

                <div className="cv-auto-footer">
                    {shouldLoad ? (
                        <Suspense fallback={<div className="min-h-[420px] bg-slate-50" />}>
                            <Footer />
                        </Suspense>
                    ) : (
                        <div className="min-h-[420px] bg-slate-50" />
                    )}
                </div>

                {/* Lazy rendered auth modal */}
                {isOpen && shouldLoad && (
                    <Suspense fallback={null}>
                        <AuthModalDeferred />
                    </Suspense>
                )}
                {/* Sync Favorites with Clerk (Only client-side when loaded) */}
                {shouldLoad && (
                    <Suspense fallback={null}>
                        <FavoritesSyncDeferred />
                    </Suspense>
                )}
            </div>
        </AppProviders>
    );

    // If ultra-lazy trigger hasn't fired yet (first paint/LCP time),
    // NEVER mount ClerkProvider even conditionally as a wrapper, to avoid the chunk payload.
    // Instead, return the bare children. Clerk initializes later transparently.
    if (!shouldLoad) {
        return childrenContent;
    }

    return (
        <LazyClerkProviderDeferred shouldLoad={true}>
            {childrenContent}
        </LazyClerkProviderDeferred>
    );
}
