'use client';

import { ReactNode, Suspense } from 'react';
import AppProviders from '@/components/layout/AppProviders';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LoginModal from '@/components/auth/LoginModal';

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

import { initSentry } from '@/utils/sentry';

export default function ClientLayout({ children }: ClientLayoutProps) {
    // Initialize Sentry monitoring
    if (typeof window !== 'undefined') {
        initSentry();
    }

    return (
        <AppProviders>
            <div className="flex flex-col min-h-screen">
                <Suspense fallback={<HeaderSkeleton />}>
                    <Header />
                </Suspense>
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </div>
            <LoginModal />
        </AppProviders>
    );
}
