'use client';

import { SignIn, useClerk } from "@clerk/nextjs";
import { useEffect, useState, Suspense } from "react";
import { useUltraLazyLoad } from "@/lib/ultra-lazy-load";
import Image from "next/image";

function SignInPageContent() {
    const clerk = useClerk();
    const [signInUrl, setSignInUrl] = useState("/");

    useEffect(() => {
        if (clerk && clerk.loaded) {
            const url = clerk.buildSignInUrl();
            setSignInUrl(url);
        }
    }, [clerk]);

    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowFallback(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!clerk?.loaded) {
        return (
            <div className="flex flex-col items-center mb-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9F1239] mb-4"></div>
                <p className="text-slate-400 text-sm">Carregando...</p>
            </div>
        );
    }

    return (
        <>
            <div className="w-full max-w-[480px]">
                <SignIn
                    path="/sign-in"
                    routing="path"
                    signUpUrl="/sign-up"
                    forceRedirectUrl="/dashboard"
                    appearance={{
                        elements: {
                            rootBox: "w-full flex justify-center",
                            card: "shadow-none w-full border-none p-0 bg-transparent",
                            headerTitle: "text-[#800020] text-2xl mb-2 font-bold font-cookie tracking-wide",
                            headerSubtitle: "text-slate-500 text-sm font-medium",
                            socialButtonsBlockButton: "border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 transition-all duration-300",
                            socialButtonsBlockButtonText: "font-medium",
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
                />
            </div>
            {showFallback && (
                <div className="mt-6 text-center animate-fade-in opacity-0 animate-delay-1000" style={{ animationFillMode: 'forwards' }}>
                    <a
                        href={signInUrl !== "/" ? signInUrl : "#"}
                        onClick={(e) => {
                            if (signInUrl === "/") e.preventDefault();
                            if (clerk?.openSignIn) clerk.openSignIn();
                        }}
                        className="text-xs text-slate-400 hover:text-[#800020] underline transition-colors cursor-pointer"
                    >
                        Problemas? Acessar login alternativo
                    </a>
                </div>
            )}
        </>
    );
}

function SignInSkeletonForm() {
    return (
        <div className="w-full flex flex-col items-center justify-center p-8 md:p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#800020] mb-4"></div>
            <p className="text-slate-400 text-sm">Carregando formulário...</p>
        </div>
    );
}

function LazySignInForm() {
    const shouldLoad = useUltraLazyLoad();

    if (!shouldLoad) {
        return <SignInSkeletonForm />;
    }
    return (
        <Suspense fallback={<SignInSkeletonForm />}>
            <SignInPageContent />
        </Suspense>
    );
}

export default function SignInPage() {

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#FDF5F5] py-8 px-4">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[700px] md:max-h-[90vh]">
                {/* Left Side - Featured Image (desktop only) */}
                <div className="hidden md:flex flex-col justify-between w-1/2 relative overflow-hidden">
                    <Image
                        src="/login-featured.webp"
                        alt="Ly Vest - Moda Intima"
                        fill
                        className="object-cover"
                        sizes="50vw"
                        priority
                    />
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    {/* Brand text at bottom */}
                    <div className="relative z-10 p-8 mt-auto">
                        <h2 className="text-white text-3xl font-cookie mb-1">Ly Vest</h2>
                        <p className="text-white/80 text-sm">Moda intima com conforto e sofisticacao</p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 bg-white flex flex-col relative overflow-hidden">
                    {/* Mobile-only Logo */}
                    <div className="md:hidden pt-8 pb-4 flex flex-col items-center">
                        <h1 className="text-4xl text-[#800020] font-cookie">Ly Vest</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Moda Intima Premium</p>
                    </div>

                    <div className="p-6 md:p-8 flex items-center justify-center flex-1 w-full overflow-y-auto">
                        <LazySignInForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
