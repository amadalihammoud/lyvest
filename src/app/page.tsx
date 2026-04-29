import dynamic from 'next/dynamic';

import type { Metadata } from 'next';

import Hero from '@/components/features/Hero';
import InfoStrip from '@/components/features/InfoStrip';

export const metadata: Metadata = {
    title: 'Lyvest — Moda Íntima Premium',
    description: 'Lyvest. Moda íntima com conforto e sofisticação. Tecidos selecionados, acabamento impecável e o cuidado de quem entende de feminino.',
    openGraph: {
        title: 'Lyvest — Moda Íntima Premium',
        description: 'Moda íntima com conforto e sofisticação. Coleção exclusiva.',
        images: ['https://lyvest.vercel.app/banner-slide-1.webp'],
    },
};

const HomePageClient = dynamic(() => import('@/components/pages/HomePageClient'), { ssr: true });

export default async function HomePage() {
    return (
        <main id="main-content" className="min-h-screen bg-background">
            {/* Critical Path — Hero editorial em fundo creme limpo */}
            <Hero />
            <InfoStrip />

            {/* Below-the-fold lazy-loaded com cv-auto */}
            <div className="cv-auto">
                <HomePageClient />
            </div>
        </main>
    );
}
