'use client';

import { ReactNode, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AppProviders from '@/components/layout/AppProviders';
// Lazy load Header to defer Clerk useUser/useClerk from critical path
const Header = dynamic(() => import('@/components/layout/Header'), { ssr: true });
// Footer lazy loaded to reduce initial TBT
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
// LoginModal lazy loaded to remove Clerk/Framer from initial bundle
const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), { ssr: false });

import { useLoginModal } from '@/store/useLoginModal';
import { initSentry } from '@/utils/sentry';

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
    const { isOpen } = useLoginModal();

    // Defer Sentry initialization to idle callback (non-blocking)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => initSentry());
            } else {
                setTimeout(() => initSentry(), 3000);
            }
        }
    }, []);

    return (
        <AppProviders>
            <div className="flex flex-col min-h-screen">
                <Suspense fallback={<HeaderSkeleton />}>
                    <Header />
                </Suspense>
                <main className="flex-grow">
                    {children}
                </main>
                <Suspense fallback={<div className="h-32 bg-slate-50" />}>
                    <Footer />
                </Suspense>

                {/* Lazy rendered modal - only loads heavy Clerk/Framer chunks when needed */}
                {isOpen && (
                    <Suspense fallback={null}>
                        <LoginModal />
                    </Suspense>
                )}
            </div>
        </AppProviders>
    );
}
