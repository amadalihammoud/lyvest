'use client';

import { ReactNode, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AppProviders from '@/components/layout/AppProviders';

// Lazy load Header to defer Clerk useUser/useClerk from critical path
const Header = dynamic(() => import('@/components/layout/Header'), { ssr: true });
// Footer lazy loaded to reduce initial TBT
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
// AuthModal lazy loaded to remove Clerk/Framer from initial bundle
const AuthModal = dynamic(() => import('@/components/auth/AuthModal'), { ssr: false });

import { useAuthModal } from '@/store/useAuthModal';
import { initSentry } from '@/utils/sentry';
import { useUltraLazyLoad } from '@/lib/ultra-lazy-load';
import { FavoritesSync } from '@/context/FavoritesContext';

interface ClientLayoutProps {
    children: ReactNode;
}

// Loading fallback for Header during SSR
function HeaderSkeleton() {
    return (
        <header className="h-20 bg-white border-b border-slate-100 fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                <div className="w-24 h-8 bg-slate-200 rounded animate-pulse"></div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
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
                (window as any).requestIdleCallback(() => initSentry());
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
                <main className="flex-grow">
                    {children}
                </main>

                {shouldLoad ? (
                    <Suspense fallback={<div className="h-32 bg-slate-50" />}>
                        <Footer />
                    </Suspense>
                ) : (
                    <div className="h-32 bg-slate-50" />
                )}

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
    );
}
