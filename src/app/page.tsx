
import type { Metadata } from 'next';
import HomePageClient from '@/components/pages/HomePageClient';

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
    return <HomePageClient />;
}
