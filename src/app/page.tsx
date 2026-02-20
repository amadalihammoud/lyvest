
import type { Metadata } from 'next';
// HomePageClient is now dynamic
import Hero from '@/components/features/Hero';
import InfoStrip from '@/components/features/InfoStrip';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Ly Vest - Moda Íntima Premium',
    description: 'Ly Vest - Moda íntima com conforto e sofisticação. Descubra nossa coleção exclusiva de lingeries, pijamas e acessórios.',
    openGraph: {
        title: 'Ly Vest - Moda Íntima Premium',
        description: 'Ly Vest - Moda íntima com conforto e sofisticação. Descubra nossa coleção exclusiva.',
        images: ['https://lyvest.vercel.app/banner-slide-1.webp'],
    },
};

// Lazy load viewport-dependent components
const HomePageClient = dynamic(() => import('@/components/pages/HomePageClient'), { ssr: true });
const Testimonials = dynamic(() => import('@/components/features/Testimonials'), { ssr: true });
// Footer removed from here as it is in ClientLayout (now lazy)

export default async function HomePage() {
    return (
        <main className="min-h-screen">
            {/* Critical Path: Loaded Immediately - Restoring Brand Gradient */}
            <div className="bg-gradient-to-b from-lyvest-500 via-[#A0303C] to-white">
                <Hero />
                <InfoStrip />
            </div>

            {/* Lazy Load Product Grid for TBT win — cv-auto skips rendering until scrolled into view */}
            <div className="container mx-auto px-4 py-8 lg:py-12 cv-auto">
                <Suspense fallback={<div className="h-96 md:h-[600px] bg-slate-50 rounded-xl" />}>
                    <HomePageClient />
                </Suspense>
            </div>
        </main>
    );
}
