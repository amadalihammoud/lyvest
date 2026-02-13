'use client';
import { SignIn, ClerkLoaded, ClerkLoading, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignInPage() {
    const clerk = useClerk();
    const [signInUrl, setSignInUrl] = useState("/");

    useEffect(() => {
        if (clerk && clerk.loaded) {
            // Construct the URL to the hosted login page
            const url = clerk.buildSignInUrl();
            setSignInUrl(url);
        }
    }, [clerk]);

    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowFallback(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#FDF8F9]">

            {/* Logo Section */}
            <div className="mb-8 flex flex-col items-center">
                <h1 className="text-4xl text-[#9F1239] font-cookie">Ly Vest</h1>
                <p className="text-sm text-slate-500 mt-2 uppercase tracking-widest text-[10px]">Moda Íntima Premium</p>
            </div>

            {/* Loading State - Managed Manually/Visual Only */}
            {(!clerk?.loaded) && (
                <div className="flex flex-col items-center mb-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9F1239] mb-4"></div>
                    <p className="text-slate-400 text-sm">Carregando...</p>
                </div>
            )}

            {/* Clerk Form */}
            {clerk?.loaded && (
                <div className="w-full max-w-[480px]">
                    <SignIn
                        path="/signin"
                        routing="path"
                        signUpUrl="/sign-up"
                        forceRedirectUrl="/dashboard"
                        appearance={{
                            elements: {
                                card: "shadow-xl border-none p-8 rounded-2xl bg-white",
                                headerTitle: "text-[#9F1239] text-xl mb-1",
                                headerSubtitle: "text-slate-500 text-sm",
                                socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50 text-slate-600",
                                socialButtonsBlockButtonText: "font-medium",
                                dividerLine: "bg-slate-100",
                                dividerText: "text-slate-400 text-xs",
                                formFieldLabel: "text-slate-700 font-medium",
                                formFieldInput: "border-slate-200 focus:border-[#9F1239] focus:ring-[#9F1239] rounded-lg",
                                formButtonPrimary: "bg-[#9F1239] hover:bg-[#881337] text-white rounded-lg font-medium shadow-md shadow-rose-200 transform transition-all hover:-translate-y-0.5",
                                footerActionText: "text-slate-500",
                                footerActionLink: "text-[#9F1239] hover:text-[#881337] font-medium"
                            },
                            layout: {
                                socialButtonsPlacement: "bottom",
                                socialButtonsVariant: "blockButton",
                                showOptionalFields: false
                            }
                        }}
                    />
                </div>
            )}

            {/* Subtle Fallback Link (Only shows if things take too long) */}
            {(!clerk?.loaded && showFallback) && (
                <div className="mt-8 text-center animate-fade-in opacity-0 animate-delay-1000" style={{ animationFillMode: 'forwards' }}>
                    <a
                        href={signInUrl !== "/" ? signInUrl : "#"}
                        onClick={(e) => {
                            if (signInUrl === "/") e.preventDefault();
                            if (clerk?.openSignIn) clerk.openSignIn();
                        }}
                        className="text-xs text-slate-400 hover:text-[#9F1239] underline transition-colors cursor-pointer"
                    >
                        Problemas? Acessar login alternativo
                    </a>
                </div>
            )}
        </div>
    );
}
