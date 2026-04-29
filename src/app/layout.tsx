import { Inter, Cormorant_Garamond } from 'next/font/google';

import type { Metadata, Viewport } from 'next';

import '@/index.css';
import ClientLayout from '@/components/layout/ClientLayout';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    // Vermelho Carmim — cor principal, Manual de Marca Lyvest §03
    themeColor: '#7D2121',
};

// Inter — sans corpo (substitui Lato com melhor legibilidade)
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
    adjustFontFallback: false,
});

// Cormorant Garamond — serif editorial para títulos display
const cormorant = Cormorant_Garamond({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-serif',
    display: 'swap',
    adjustFontFallback: false,
});

export const metadata: Metadata = {
    title: {
        default: 'Lyvest — Moda Íntima Premium',
        template: '%s | Lyvest'
    },
    description: 'Lyvest. Moda íntima com conforto e sofisticação. Tecidos selecionados, acabamento impecável e o cuidado de quem entende de feminino.',
    keywords: ['moda íntima', 'lingerie', 'conforto', 'sofisticação', 'lyvest', 'sutiã', 'calcinha', 'pijama'],
    authors: [{ name: 'Lyvest' }],
    creator: 'Lyvest',
    publisher: 'Lyvest',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: 'Lyvest — Moda Íntima Premium',
        description: 'Moda íntima com conforto e sofisticação. Coleção exclusiva.',
        url: 'https://lyvest.vercel.app',
        siteName: 'Lyvest',
        locale: 'pt_BR',
        type: 'website',
        images: [
            {
                url: 'https://lyvest.vercel.app/assets/banners/banner-slide-1.webp',
                width: 1200,
                height: 630,
                alt: 'Lyvest — Moda Íntima',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Lyvest — Moda Íntima Premium',
        description: 'Moda íntima com conforto e sofisticação.',
        images: ['https://lyvest.vercel.app/assets/banners/banner-slide-1.webp'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import HeaderInteractive from '@/components/layout/HeaderInteractive';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable} bg-background`}>
            <head>
                {/* LCP native responsive preloads */}
                <link rel="preload" href="/assets/banners/banner-slide-1-mobile.webp" as="image" type="image/webp" fetchPriority="high" media="(max-width: 767px)" />
                <link rel="preload" href="/assets/banners/banner-slide-1.webp" as="image" type="image/webp" fetchPriority="high" media="(min-width: 768px)" />

                <link rel="preconnect" href="https://va.vercel-scripts.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://vitals.vercel-insights.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://img.clerk.com" />
                <link rel="icon" type="image/png" href="/assets/pwa/pwa-192x192.png" />
                <link rel="manifest" href="/assets/pwa/manifest.json" />

                <script
                    type="speculationrules"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            prefetch: [{
                                source: "document",
                                where: {
                                    and: [
                                        { href_matches: "/*" },
                                        { not: { href_matches: ["/checkout*", "/dashboard*", "/api/*", "/sign-*"] } }
                                    ]
                                },
                                eagerness: "moderate"
                            }]
                        })
                    }}
                />
            </head>
            <body className="bg-background text-foreground font-sans antialiased min-h-screen">
                <HeaderInteractive />
                <ClientLayout>
                    {children}
                </ClientLayout>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
