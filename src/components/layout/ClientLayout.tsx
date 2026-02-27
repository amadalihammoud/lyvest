'use client';

import { ReactNode, Suspense, useEffect, useState, lazy } from 'react';
import { usePathname } from 'next/navigation';

import AppProviders from '@/components/layout/AppProviders';

// Footer lazy loaded to reduce initial TBT
const Footer = lazy(() => import('@/components/layout/Footer'));

// AuthModal lazy loaded to remove Clerk/Framer from initial bundle
const AuthModalDeferred = lazy(() => import('@/components/auth/AuthModal'));

// Strictly decouple LazyClerkProvider from the module graph until needed
// This prevents Next.js from sending the 200KB clerk.js chunk in the initial HTML
const LazyClerkProviderDeferred = lazy(() => import('@/components/providers/LazyClerkProvider').then(mod => ({ default: mod.LazyClerkProvider })));

import { useUltraLazyLoad } from '@/lib/ultra-lazy-load';
import { useAuthModal } from '@/store/useAuthModal';
import { initSentry } from '@/utils/sentry';

// Routes that require Clerk auth immediately (skip the lazy 7s window).
// These are protected pages the user navigates to intentionally.
const EAGER_CLERK_ROUTES = ['/dashboard', '/admin', '/conta', '/pedidos'];

// Isolate FavoritesSync so Clerk is not pulled into the global bundle
const FavoritesSyncDeferred = lazy(() => import('@/components/auth/FavoritesSync').then(mod => ({ default: mod.FavoritesSync })));

interface ClientLayoutProps {
    children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const { isOpen } = useAuthModal();
    const pathname = usePathname();
    const ultraShouldLoad = useUltraLazyLoad();

    // For auth-required routes, load Clerk immediately on mount instead of waiting
    // for the ultra-lazy 7s timer used to optimize the public-facing homepage LCP.
    const isEagerRoute = EAGER_CLERK_ROUTES.some(r => pathname?.startsWith(r));
    const [eagerLoaded, setEagerLoaded] = useState(false);
    useEffect(() => {
        if (isEagerRoute) setEagerLoaded(true);
    }, [isEagerRoute]);

    const shouldLoad = ultraShouldLoad || eagerLoaded;

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
                <main id="main-content" tabIndex={-1} className="flex-grow outline-none">
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
        <Suspense fallback={childrenContent}>
            <LazyClerkProviderDeferred shouldLoad={true}>
                {childrenContent}
            </LazyClerkProviderDeferred>
        </Suspense>
    );
}
