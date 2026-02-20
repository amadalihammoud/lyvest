
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

                {/* CRITICAL CSS INLINE — Essential layout styles to ensure NO render delay on LCP element */}
                <style id="critical-css" dangerouslySetInnerHTML={{
                    __html: `
                        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
                        html{-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;background:#FDF5F5}
                        body{margin:0;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1e293b;background:#FDF5F5;overflow-x:hidden}
                        .flex{display:flex}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}
                        .container{width:100%;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
                        @media (min-width:640px){.container{max-width:640px}}
                        @media (min-width:768px){.container{max-width:768px}}
                        @media (min-width:1024px){.container{max-width:1440px}}
                        .bg-lyvest-500{background-color:#800020}.relative{position:relative}.overflow-hidden{overflow:hidden}
                        .h-16{height:4rem}.md\\:h-12{height:3rem}.w-auto{width:auto}
                        .sticky{position:sticky}.top-0{top:0}.z-50{z-index:50}.bg-white{background-color:#fff}.shadow-sm{box-shadow:0 1px 2px 0 rgba(0,0,0,0.05)}
                        .hero-mobile-compact{padding-top:0.5rem;padding-bottom:1.5rem}
                        @media (min-width:1024px){.lg\\:pt-4{padding-top:1rem}.lg\\:pb-20{padding-bottom:5rem}}
                        .inset-0{position:absolute;top:0;right:0;bottom:0;left:0}.object-cover{object-block:cover}
                        img{max-width:100%;height:auto;display:block}
                        .bg-gradient-to-b{background-image:linear-gradient(to bottom, var(--tw-gradient-stops))}
                        .from-lyvest-500{--tw-gradient-from:#800020;--tw-gradient-to:rgb(128 0 32 / 0);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to)}
                    `
                }} />

                {/* LOAD MAIN CSS asynchronously to unblock LCP rendering */}
                <link
                    rel="stylesheet"
                    href="/index.css"
                    id="main-css"
                    media="print"
                />
                <script dangerouslySetInnerHTML={{
                    __html: `document.getElementById('main-css').onload = function() { this.media='all'; }`
                }} />
                <noscript>
                    <link rel="stylesheet" href="/index.css" />
                </noscript>

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
