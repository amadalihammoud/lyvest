
import type { Metadata } from 'next';
import { Lato, Cookie } from 'next/font/google';
import '@/index.css';
import ClientLayout from '@/components/layout/ClientLayout';

// Font configuration with display: swap for better FCP
// Inter font removed — Lato is the primary font, Inter was unused
const lato = Lato({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-lato',
    display: 'swap',
});
const cookie = Cookie({
    weight: ['400'],
    subsets: ['latin'],
    variable: '--font-cookie',
    display: 'swap',
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

import { LazyClerkProvider } from '@/components/providers/LazyClerkProvider';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LazyClerkProvider>
            <html lang="pt-BR" className={`${lato.variable} ${cookie.variable}`}>
                <head>
                    <link rel="dns-prefetch" href="https://clerk.lyvest.com.br" />
                    <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
                    <link rel="dns-prefetch" href="https://shgdgelnddjnemfgzzfv.supabase.co" />

                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link rel="preconnect" href="https://clerk.lyvest.com.br" crossOrigin="anonymous" />
                    <link rel="icon" type="image/svg+xml" href="/logo.svg" />

                    {/* PRELOAD HERO IMAGES (Raw Paths) */}
                    <link
                        rel="preload"
                        as="image"
                        href="/banner-slide-1-mobile.webp"
                        media="(max-width: 767px)"
                    />
                    <link
                        rel="preload"
                        as="image"
                        href="/banner-slide-1.webp"
                        media="(min-width: 768px)"
                    />

                    {/* CRITICAL CSS INLINE */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
                            html{-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
                            body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.5;color:#1a1a1a;background:#fff;overflow-x:hidden}
                            .hero{position:relative;width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f5f5f5;contain:layout style paint}
                            .hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;will-change:transform}
                            .btn{display:inline-block;padding:12px 28px;font-size:16px;font-weight:600;text-decoration:none;border:none;border-radius:6px;cursor:pointer;background:#000;color:#fff;}
                            :focus-visible{outline:2px solid #000;outline-offset:4px}
                        `
                    }} />
                </head>
                <body className="bg-slate-50 text-slate-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
                    <ClientLayout>
                        {children}
                    </ClientLayout>
                </body>
            </html>
        </LazyClerkProvider>
    );
}
