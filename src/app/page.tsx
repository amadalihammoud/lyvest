import dynamic from 'next/dynamic';

import type { Metadata } from 'next';

import Hero from '@/components/features/Hero';
import InfoStrip from '@/components/features/InfoStrip';
import { getProducts } from '@/server/providers/catalog';

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

// Estratégia de renderização DECLARADA. Sem isto, a home era elegível a
// renderização estática sob demanda e o HTML ficava no Full Route Cache sem
// prazo de validade — preço e catálogo congelados até o próximo deploy.
// 5 min é folgado para vitrine: preço e estoque autoritativos são revalidados
// no checkout de qualquer forma.
export const revalidate = 300;

export default async function HomePage() {
    // Catálogo lido NO SERVIDOR: é o que faz a grade existir no HTML entregue ao
    // crawler e ao primeiro paint, em vez de aparecer só após a hidratação.
    //
    // O erro PROPAGA de propósito. Com ISR, uma regeneração que falha faz o Next
    // continuar servindo a última versão boa do cache — falha transitória de
    // banco não afeta ninguém e se resolve na próxima revalidação.
    // Se em vez disso capturássemos o erro e seguíssemos com a grade vazia, a
    // regeneração "teria sucesso" e SOBRESCREVERIA a página boa por uma vazia,
    // que ficaria no cache e poderia ser rastreada pelo Google — exatamente a
    // página vazia que este trabalho existe para eliminar.
    // No build, falhar é o comportamento certo: não se publica vitrine sem catálogo.
    const initialProducts = await getProducts();

    return (
        <main className="min-h-screen">
            {/* Critical Path: Loaded Immediately - faixa solida na cor da marca, de ponta a ponta */}
            <div className="bg-lyvest-500">
                <Hero />
                <InfoStrip />
            </div>

            {/* Lazy Load Product Grid for TBT win — cv-auto skips rendering until scrolled into view */}
            <div className="container mx-auto px-4 pb-8 lg:pb-12 pt-2 lg:pt-4 cv-auto">
                <HomePageClient initialProducts={initialProducts} />
            </div>

            {/* Newsletter rendered outside the centered container so the band goes edge to edge */}
            <NewsletterSection />
        </main>
    );
}
