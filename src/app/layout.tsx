
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

import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider
            localization={ptBR}
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            appearance={{
                variables: {
                    colorPrimary: '#800020',
                    colorText: '#334155',
                    colorTextSecondary: '#64748B',
                    colorBackground: '#ffffff',
                    colorInputBackground: '#F8FAFC',
                    colorInputText: '#334155',
                    borderRadius: '0.75rem',
                    fontFamily: 'var(--font-lato)',
                },
                elements: {
                    rootBox: "w-full",
                    card: "shadow-2xl shadow-rose-900/10 border border-rose-100 p-8 rounded-2xl bg-white/95 backdrop-blur-sm",
                    headerTitle: "text-[#800020] text-2xl mb-2 font-bold font-cookie tracking-wide",
                    headerSubtitle: "text-slate-500 text-sm font-medium",
                    socialButtonsBlockButton: "border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 transition-all duration-300",
                    socialButtonsBlockButtonText: "font-medium group-hover:text-[#800020]",
                    dividerLine: "bg-gradient-to-r from-transparent via-slate-200 to-transparent",
                    dividerText: "text-slate-400 text-xs font-medium uppercase tracking-widest px-3 bg-white",
                    formFieldLabel: "text-slate-700 font-semibold text-sm mb-1.5",
                    formFieldInput: "bg-slate-50 border-slate-200 focus:border-[#800020] focus:ring-[#800020]/20 transition-all duration-300 rounded-xl py-2.5",
                    formButtonPrimary: "bg-gradient-to-r from-[#800020] to-[#600018] hover:from-[#900024] hover:to-[#800020] text-white rounded-xl font-bold py-3 shadow-lg shadow-rose-900/20 transform transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wide uppercase",
                    footerActionText: "text-slate-500 font-medium",
                    footerActionLink: "text-[#800020] hover:text-[#600018] font-bold hover:underline decoration-2 underline-offset-4 transition-all"
                },
                layout: {
                    socialButtonsPlacement: "bottom",
                    socialButtonsVariant: "blockButton",
                    showOptionalFields: false
                }
            }}
        >
            <html lang="pt-BR" className={`${lato.variable} ${cookie.variable}`}>
                <head>
                    <link rel="dns-prefetch" href="https://clerk.lyvest.com.br" />
                    <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
                    <link rel="dns-prefetch" href="https://shgdgelnddjnemfgzzfv.supabase.co" />

                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link rel="preconnect" href="https://clerk.lyvest.com.br" crossOrigin="anonymous" />
                    <link rel="icon" type="image/svg+xml" href="/logo.svg" />

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
        </ClerkProvider>
    );
}
