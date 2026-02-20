
import type { Metadata, Viewport } from 'next';
import { Lato, Cookie } from 'next/font/google';
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
                url: 'https://lyvest.vercel.app/banner-slide-1.webp',
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
        images: ['https://lyvest.vercel.app/banner-slide-1.webp'],
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className={`${lato.variable} ${cookie.variable}`}>
            <head>
                {/* DNS-prefetch for non-critical third-party origins */}
                <link rel="dns-prefetch" href="https://img.clerk.com" />
                <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
                <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
                <link rel="icon" type="image/png" href="/logo.png" />
                <link rel="manifest" href="/manifest.json" />

                {/* PRELOAD HERO IMAGES DIRECTLY - bypassing /_next/image proxy for pure CDN LCP speed */}
                <link
                    rel="preload"
                    as="image"
                    type="image/webp"
                    href="/banner-slide-1-mobile.webp"
                    media="(max-width: 767px)"
                    fetchPriority="high"
                />
                <link
                    rel="preload"
                    as="image"
                    type="image/webp"
                    href="/banner-slide-1.webp"
                    media="(min-width: 768px)"
                    fetchPriority="high"
                />

                {/* DEFER MAIN CSS to prevent 960ms render blocking on Mobile */}
                <link
                    rel="stylesheet"
                    href="/index.css"
                    id="main-stylesheet"
                    media="print"
                />
                <script dangerouslySetInnerHTML={{
                    __html: `document.getElementById('main-stylesheet').addEventListener('load', function() { this.media='all'; })`
                }} />
                <noscript>
                    <link rel="stylesheet" href="/index.css" />
                </noscript>

                {/* CRITICAL CSS INLINE — Essential layout styles only to avoid FOUC */}
                <style dangerouslySetInnerHTML={{
                    __html: `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}body{margin:0;font-family:var(--font-lato),system-ui,-apple-system,sans-serif;line-height:1.5;color:#1e293b;background:#FDF5F5;overflow-x:hidden}.flex{display:flex}.flex-col{flex-direction:column}.container{width:100%;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}@media (min-width: 640px){.container{max-width:640px}}@media (min-width: 768px){.container{max-width:768px}}@media (min-width: 1024px){.container{max-width:1024px}}@media (min-width: 1280px){.container{max-width:1280px}}@media (min-width: 1536px){.container{max-width:1440px}}.bg-lyvest-500{background-color:#800020}.font-cookie{font-family:var(--font-cookie),cursive}.relative{position:relative}.overflow-hidden{overflow:hidden}.hidden{display:none}@media (min-width: 768px){.md\\:block{display:block}.md\\:grid{display:grid}.md\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.md\\:-mt-12{margin-top:-3rem}}.lg\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}img{max-width:100%;height:auto;display:block}`
                }} />

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
                <ClientLayout>
                    {children}
                </ClientLayout>
                <Analytics />
            </body>
        </html>
    );
}
