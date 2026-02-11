
import type { Metadata } from 'next';
import { Inter, Lato, Cookie } from 'next/font/google';
import '@/index.css';
import ClientLayout from '@/components/layout/ClientLayout';

// Font configuration with display: swap for better FCP
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});
const lato = Lato({
    weight: ['300', '400', '700', '900'],
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
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PK_PROD || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
            <html lang="pt-BR" className={`${inter.variable} ${lato.variable} ${cookie.variable}`}>
                <head>
                    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
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
