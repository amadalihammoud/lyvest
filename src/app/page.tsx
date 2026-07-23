import dynamic from 'next/dynamic';

import type { Metadata } from 'next';

import Hero from '@/components/features/Hero';
import InfoStrip from '@/components/features/InfoStrip';

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
const NewsletterSection = dynamic(() => import('@/components/pages/HomePageClient').then(m => m.NewsletterSection), { ssr: true });

export default async function HomePage() {
    return (
        <main className="min-h-screen">
            {/* Critical Path: Loaded Immediately - faixa solida na cor da marca, de ponta a ponta */}
            <div className="bg-lyvest-500">
                <Hero />
                <InfoStrip />
            </div>

            {/* Lazy Load Product Grid for TBT win — cv-auto skips rendering until scrolled into view */}
            <div className="container mx-auto px-4 pb-8 lg:pb-12 pt-2 lg:pt-4 cv-auto">
                <HomePageClient />
            </div>

            {/* Newsletter rendered outside the centered container so the band goes edge to edge */}
            <NewsletterSection />
        </main>
    );
}
