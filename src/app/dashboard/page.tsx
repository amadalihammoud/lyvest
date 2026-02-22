
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { useUltraLazyLoad } from '@/lib/ultra-lazy-load';

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
    const shouldLoad = useUltraLazyLoad();

    if (!shouldLoad) {
        return <DashboardSkeleton />;
    }

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardPageClient />
        </Suspense>
    );
}
