
import type { Metadata } from 'next';
import HomePageClient from '@/components/pages/HomePageClient';
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
        images: ['https://lyvest.vercel.app/og-default.jpg'],
    },
};

// Lazy load viewport-dependent components
const Testimonials = dynamic(() => import('@/components/features/Testimonials'), { ssr: true });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });

export default async function HomePage() {
    return (
        <main className="min-h-screen">
            {/* Critical Path: Loaded Immediately */}
            <div className="bg-gradient-to-b from-white to-pink-50/30">
                <Hero />
                <InfoStrip />
            </div>

            <div className="container mx-auto px-4 py-8 lg:py-12">
                <HomePageClient />
            </div>

            {/* Non-Critical: Lazy Loaded */}
            <Suspense fallback={<div className="h-64 bg-sky-50/30 animate-pulse" />}>
                <Testimonials />
            </Suspense>

            <Suspense fallback={<div className="h-32 bg-slate-50" />}>
                <Footer />
            </Suspense>
        </main>
    );
}
