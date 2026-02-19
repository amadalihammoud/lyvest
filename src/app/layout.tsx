
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
                url: 'https://lyvest.vercel.app/og-default.jpg',
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
        images: ['https://lyvest.vercel.app/og-default.jpg'],
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
                <link rel="preconnect" href="https://lyvest.com.br" />
                <link rel="dns-prefetch" href="https://lyvest.com.br" />
                <link rel="icon" type="image/png" href="/logo.png" />

                {/* PRELOAD HERO IMAGES — imagesrcset lets browser pick correct width for device DPR */}
                <link
                    rel="preload"
                    as="image"
                    type="image/webp"
                    imageSrcSet="/_next/image?url=%2Fbanner-slide-1-mobile.webp&w=640&q=75 640w, /_next/image?url=%2Fbanner-slide-1-mobile.webp&w=750&q=75 750w, /_next/image?url=%2Fbanner-slide-1-mobile.webp&w=828&q=75 828w, /_next/image?url=%2Fbanner-slide-1-mobile.webp&w=1080&q=75 1080w, /_next/image?url=%2Fbanner-slide-1-mobile.webp&w=1200&q=75 1200w, /_next/image?url=%2Fbanner-slide-1-mobile.webp&w=1920&q=75 1920w"
                    imageSizes="100vw"
                    media="(max-width: 767px)"
                    fetchPriority="high"
                />
                <link
                    rel="preload"
                    as="image"
                    type="image/webp"
                    imageSrcSet="/_next/image?url=%2Fbanner-slide-1.webp&w=640&q=75 640w, /_next/image?url=%2Fbanner-slide-1.webp&w=750&q=75 750w, /_next/image?url=%2Fbanner-slide-1.webp&w=828&q=75 828w, /_next/image?url=%2Fbanner-slide-1.webp&w=1080&q=75 1080w, /_next/image?url=%2Fbanner-slide-1.webp&w=1200&q=75 1200w, /_next/image?url=%2Fbanner-slide-1.webp&w=1920&q=75 1920w"
                    imageSizes="(max-width: 1400px) 100vw, 1400px"
                    media="(min-width: 768px)"
                    fetchPriority="high"
                />

                {/* CRITICAL CSS INLINE — only resets, no unused .hero/.header classes */}
                <style dangerouslySetInnerHTML={{
                    __html: `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.5;color:#1a1a1a;background:#fff;overflow-x:hidden}@media(min-width:768px){.mobile-only{display:none!important}}@media(max-width:767.98px){.desktop-only{display:none!important}}`
                }} />
            </head>
            <body className="bg-slate-50 text-slate-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
                <ClientLayout>
                    {children}
                </ClientLayout>
                <Analytics />
            </body>
        </html>
    );
}
