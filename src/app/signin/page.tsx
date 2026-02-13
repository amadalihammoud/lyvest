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
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Login Ly Vest</h1>

            <div className="mb-4 text-xs text-slate-400">
                Status: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
                    ? `Chave: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 15)}...`
                    : "Chave Faltando"}
            </div>

            {/* Loading State - Managed Manually/Visual Only */}
            {(!clerk?.loaded) && (
                <div className="flex flex-col items-center mb-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mb-4"></div>
                    <p className="text-slate-500">Carregando sistema de login...</p>
                </div>
            )}

            {/* Clerk Form - Only shows when loaded */}
            {clerk?.loaded && (
                <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-sm border border-slate-200 min-h-[400px]">
                    <div className="text-center text-xs text-slate-400 mb-2">Área segura Clerk</div>
                    <SignIn path="/signin" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
                </div>
            )}

            {/* Fallback Section - Shows if loaded OR if timeout occurs */}
            {(clerk?.loaded || showFallback) && (
                <div className="mt-8 text-center animate-fade-in">
                    <p className="text-slate-600 mb-2">Problemas com o formulário?</p>
                    <a
                        href={signInUrl !== "/" ? signInUrl : "#"}
                        onClick={(e) => {
                            if (signInUrl === "/") {
                                e.preventDefault();
                                // Try to force open if possible, or reload
                                if (clerk?.openSignIn) {
                                    clerk.openSignIn();
                                } else {
                                    alert("Não foi possível conectar ao Clerk. Recarregando...");
                                    window.location.reload();
                                }
                            }
                        }}
                        className="inline-block bg-slate-800 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                        Acessar Portal de Login (Externo)
                    </a>
                </div>
            )}

            {!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                <p className="mt-8 text-red-500 font-bold">Erro Fatal: API Key não encontrada</p>
            )}
        </div>
    );
}
