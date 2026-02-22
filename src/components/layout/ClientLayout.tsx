'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense, useEffect } from 'react';

import AppProviders from '@/components/layout/AppProviders';

// Footer lazy loaded to reduce initial TBT
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
// AuthModal lazy loaded to remove Clerk/Framer from initial bundle
const AuthModal = dynamic(() => import('@/components/auth/AuthModal'), { ssr: false });

import { LazyClerkProvider } from '@/components/providers/LazyClerkProvider';
import { useUltraLazyLoad } from '@/lib/ultra-lazy-load';
import { useAuthModal } from '@/store/useAuthModal';
import { initSentry } from '@/utils/sentry';

// Isolate FavoritesSync so Clerk is not pulled into the global bundle
const FavoritesSync = dynamic(() => import('@/components/auth/FavoritesSync'), { ssr: false });

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

    return (
        <LazyClerkProvider shouldLoad={shouldLoad}>
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
                            <AuthModal />
                        </Suspense>
                    )}
                    {/* Sync Favorites with Clerk (Only client-side when loaded) */}
                    {shouldLoad && (
                        <Suspense fallback={null}>
                            <FavoritesSync />
                        </Suspense>
                    )}
                </div>
            </AppProviders>
        </LazyClerkProvider>
    );
}
