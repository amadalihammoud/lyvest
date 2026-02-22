import { Lato, Cookie } from 'next/font/google';
import { preload } from 'react-dom';
import { Suspense } from 'react';

import type { Metadata, Viewport } from 'next';

import '@/index.css';
import ClientLayout from '@/components/layout/ClientLayout';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#800020',
};

// Font configuration with display: swap for better FCP
// Inter font removed — Lato is the primary font, Inter was unused
const lato = Lato({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-lato',
    display: 'swap',
    adjustFontFallback: false, // Avoid extra CSS for fallback metrics — reduces render-blocking
});
const cookie = Cookie({
    weight: ['400'],
    subsets: ['latin'],
    variable: '--font-cookie',
    display: 'swap',
    adjustFontFallback: false,
});

export const metadata: Metadata = {
    title: {
        default: 'Ly Vest - Moda Íntima Premium',
        template: '%s | Ly Vest'
    },
    description: 'Ly Vest - Moda íntima com conforto e sofisticação. Descubra nossa coleção exclusiva de lingeries, pijamas e acessórios.',
    keywords: ['moda íntima', 'lingerie', 'conforto', 'sofisticação', 'ly vest', 'sutiã', 'calcinha', 'pijama'],
    authors: [{ name: 'Ly Vest' }],
    creator: 'Ly Vest',
    publisher: 'Ly Vest',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: 'Ly Vest - Moda Íntima Premium',
        description: 'Ly Vest - Moda íntima com conforto e sofisticação. Descubra nossa coleção exclusiva.',
        url: 'https://lyvest.vercel.app',
        siteName: 'Ly Vest',
        locale: 'pt_BR',
        type: 'website',
        images: [
            {
                url: 'https://lyvest.vercel.app/assets/banners/banner-slide-1.webp',
                width: 1200,
                height: 630,
                alt: 'Ly Vest - Moda Íntima',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Ly Vest - Moda Íntima Premium',
        description: 'Ly Vest - Moda íntima com conforto e sofisticação.',
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
import Header from '@/components/layout/Header';
import HeaderInteractive from '@/components/layout/HeaderInteractive';

function HeaderFallback() {
    return (
        <Suspense fallback={<div className="h-20 w-full bg-white shadow-sm" />}>
            <HeaderInteractive user={null} />
        </Suspense>
    );
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Desktop and Mobile LCP responsive preload using imageSrcSet
    // This perfectly matches the <picture> tag in Hero.tsx and hoists it above CSS
    preload('/assets/banners/banner-slide-1.webp', {
        as: 'image',
        fetchPriority: 'high',
        imageSrcSet: '/assets/banners/banner-slide-1-mobile.webp 767w, /assets/banners/banner-slide-1.webp 1400w',
        imageSizes: '(max-width: 767px) 100vw, 100vw'
    });

    return (
        <html lang="pt-BR" className={`${lato.variable} ${cookie.variable}`}>
            <head>
                {/* DNS-prefetch for non-critical third-party origins */}
                <link rel="dns-prefetch" href="https://img.clerk.com" />
                <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
                <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
                <link rel="icon" type="image/png" href="/assets/pwa/pwa-192x192.png" />
                <link rel="manifest" href="/assets/pwa/manifest.json" />

                {/* Speculation Rules — prefetch likely navigation targets during idle time.
                    Chromium 109+, gracefully ignored by other browsers. */}
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
            <body className="bg-[#FDF5F5] text-slate-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
                <Suspense fallback={<HeaderFallback />}>
                    <Header />
                </Suspense>
                <ClientLayout>
                    {children}
                </ClientLayout>
                <Analytics />
                <SpeedInsights />
            </body>
        </html >
    );
}
