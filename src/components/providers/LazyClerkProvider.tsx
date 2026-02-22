'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import ClerkProvider + ptBR together to keep them out of the main bundle
const ClerkProvider = dynamic(
    () => Promise.all([
        import('@clerk/nextjs').then((mod) => mod.ClerkProvider),
        import('@clerk/localizations').then((mod) => mod.ptBR),
    ]).then(([ClerkProviderComponent, ptBRLocale]) => {
        // Wrap so dynamic() receives a default export component with ptBR baked in
        const Wrapped = ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
            <ClerkProviderComponent {...props} localization={ptBRLocale}>
                {children}
            </ClerkProviderComponent>
        );
        Wrapped.displayName = 'ClerkProviderWithLocale';
        return { default: Wrapped };
    }),
    { ssr: false }
);

interface LazyClerkProviderProps {
    children: ReactNode;
    shouldLoad: boolean;
}

export function LazyClerkProvider({ children, shouldLoad }: LazyClerkProviderProps) {
    // While waiting for Clerk, render children directly (unauthenticated state)
    // This maintains LCP content visibility
    if (!shouldLoad) {
        return <>{children}</>;
    }

    return (
        <ClerkProvider
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
            {children}
        </ClerkProvider>
    );
}
