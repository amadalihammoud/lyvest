
import type { Metadata } from 'next';
import HomePageClient from '@/components/pages/HomePageClient';
import Hero from '@/components/features/Hero';
import InfoStrip from '@/components/features/InfoStrip';

export const metadata: Metadata = {
    title: 'Ly Vest - Moda Íntima Premium',
    description: 'Ly Vest - Moda íntima com conforto e sofisticação. Descubra nossa coleção exclusiva de lingeries, pijamas e acessórios.',
    openGraph: {
        title: 'Ly Vest - Moda Íntima Premium',
        description: 'Ly Vest - Moda íntima com conforto e sofisticação. Descubra nossa coleção exclusiva.',
        images: ['https://lyvest.vercel.app/og-default.jpg'],
    },
};

export default function HomePage() {
    return (
        <>
            {/* Hero & Info Banner - Rendered Immediately (SSR) to improve LCP */}
            <div className="bg-gradient-to-b from-lyvest-500 via-[#A0303C] to-white">
                <Hero />
                <InfoStrip />
            </div>
            <HomePageClient />
        </>
    );
}
