
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { useUltraLazyLoad } from '@/lib/ultra-lazy-load';

const CheckoutPageClient = dynamic(
    () => import('@/components/pages/CheckoutPageClient'),
    { ssr: false }
);

function CheckoutSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            <div className="h-10 w-1/3 bg-slate-100 rounded-lg mb-8"></div>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="w-full lg:w-96 h-64 bg-slate-100 rounded-xl"></div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    const shouldLoad = useUltraLazyLoad();

    if (!shouldLoad) {
        return <CheckoutSkeleton />;
    }

    return (
        <Suspense fallback={<CheckoutSkeleton />}>
            <CheckoutPageClient />
        </Suspense>
    );
}
