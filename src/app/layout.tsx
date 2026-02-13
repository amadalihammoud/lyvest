
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
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            appearance={{
                variables: {
                    colorPrimary: '#800020', // Bordô Ly Vest
                    colorText: '#334155',
                    colorTextSecondary: '#64748B',
                    fontFamily: 'var(--font-lato)',
                },
                elements: {
                    card: "shadow-xl border-none p-8 rounded-2xl bg-white",
                    headerTitle: "text-[#800020] text-xl mb-1 font-bold",
                    headerSubtitle: "text-slate-500 text-sm",
                    socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50 text-slate-600",
                    socialButtonsBlockButtonText: "font-medium",
                    dividerLine: "bg-slate-100",
                    dividerText: "text-slate-400 text-xs",
                    formFieldLabel: "text-slate-700 font-medium",
                    formFieldInput: "border-slate-200 focus:border-[#800020] focus:ring-[#800020] rounded-lg",
                    formButtonPrimary: "bg-[#800020] hover:bg-[#600018] text-white rounded-lg font-medium shadow-md shadow-rose-200 transform transition-all hover:-translate-y-0.5",
                    footerActionText: "text-slate-500",
                    footerActionLink: "text-[#800020] hover:text-[#600018] font-medium"
                },
                layout: {
                    socialButtonsPlacement: "bottom",
                    socialButtonsVariant: "blockButton",
                    showOptionalFields: false
                }
            }}
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
