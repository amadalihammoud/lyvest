import { Lato, Cookie } from 'next/font/google';
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
import HeaderInteractive from '@/components/layout/HeaderInteractive';
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <html lang="pt-BR" className={`${lato.variable} ${cookie.variable}`}>
            <head>
                {/* 1. LCP native responsive preloads: forces discovery 800ms earlier on Mobile/Desktop */}
                <link rel="preload" href="/assets/banners/banner-slide-1-mobile.webp" as="image" type="image/webp" fetchPriority="high" media="(max-width: 767px)" />
                <link rel="preload" href="/assets/banners/banner-slide-1.webp" as="image" type="image/webp" fetchPriority="high" media="(min-width: 768px)" />

                {/* Preconnect for third-party origins loaded during page interaction.
                    preconnect (vs dns-prefetch) also performs the TCP + TLS handshake
                    early, saving ~100-200 ms on the first real request to each origin. */}
                <link rel="preconnect" href="https://va.vercel-scripts.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://vitals.vercel-insights.com" crossOrigin="anonymous" />
                {/* img.clerk.com only loads after user interaction (lazy Clerk) — dns-prefetch is enough */}
                <link rel="dns-prefetch" href="https://img.clerk.com" />
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
                <HeaderInteractive />
                <ClientLayout>
                    {children}
                </ClientLayout>
                <Analytics />
                <SpeedInsights />
            </body>
        </html >
    );
}
