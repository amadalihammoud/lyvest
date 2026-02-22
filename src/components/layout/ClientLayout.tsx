'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense, useEffect } from 'react';

import AppProviders from '@/components/layout/AppProviders';

// Lazy load Header to defer Clerk useUser/useClerk from critical path
const Header = dynamic(() => import('@/components/layout/Header'), { ssr: true });
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

// Loading fallback for Header — must match real Header layout exactly to avoid CLS.
// Header.tsx uses: sticky top-0 z-50 bg-white shadow-sm + container px-4 py-2 lg:py-4
function HeaderSkeleton() {
    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="container mx-auto px-4 py-2 lg:py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 mr-12 lg:mr-24">
                        <div className="lg:hidden p-3">
                            <div className="w-7 h-7 bg-slate-200 rounded-full"></div>
                        </div>
                        <div className="w-24 h-16 md:h-12 bg-slate-200 rounded"></div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
                        <div className="p-2 sm:p-2.5"><div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-200 rounded-full"></div></div>
                        <div className="p-2 sm:p-2.5"><div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-200 rounded-full"></div></div>
                        <div className="p-2 sm:p-3"><div className="w-5 h-5 sm:w-7 sm:h-7 bg-slate-200 rounded-full"></div></div>
                    </div>
                </div>
            </div>
        </header>
    );
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
                    {/* Defer Header rendering to avoid Clerk useUser during SSR/Lazy load */}
                    {shouldLoad ? (
                        <Suspense fallback={<HeaderSkeleton />}>
                            <Header />
                        </Suspense>
                    ) : (
                        <HeaderSkeleton />
                    )}
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
