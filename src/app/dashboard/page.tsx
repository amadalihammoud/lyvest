
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';

// Dynamically import client component to ensure no SSR attempts
const DashboardPageClient = dynamic(
    () => import('@/components/pages/DashboardPageClient'),
    { ssr: false }
);

function DashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            <div className="h-20 bg-slate-100 rounded-xl mb-8"></div>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-64 h-96 bg-slate-100 rounded-xl"></div>
                <div className="flex-1 h-96 bg-slate-100 rounded-xl"></div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    // Dashboard is a protected route navigated to intentionally — load immediately on mount
    // instead of waiting for the ultra-lazy 7s fallback used by the homepage.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <DashboardSkeleton />;
    }

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardPageClient />
        </Suspense>
    );
}
