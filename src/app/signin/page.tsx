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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Login Ly Vest</h1>

            <div className="mb-4 text-xs text-slate-400">
                Status: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Chave Encontrada" : "Chave Faltando"}
            </div>

            <ClerkLoading>
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mb-4"></div>
                    <p className="text-slate-500">Carregando formulário...</p>
                </div>
            </ClerkLoading>

            <ClerkLoaded>
                <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-sm border border-slate-200 min-h-[400px]">
                    <div className="text-center text-xs text-slate-400 mb-2">Área segura Clerk</div>
                    {/* The SignIn component should render here */}
                    <SignIn path="/signin" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-600 mb-2">Não está visualizando o formulário?</p>
                    <a
                        href={signInUrl}
                        onClick={(e) => {
                            if (signInUrl === "/") e.preventDefault();
                            if (clerk && clerk.openSignIn) clerk.openSignIn();
                        }}
                        className="inline-block bg-slate-800 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors"
                    >
                        Acessar Portal de Login
                    </a>
                </div>
            </ClerkLoaded>

            {!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                <p className="mt-8 text-red-500 font-bold">Erro Fatal: API Key não encontrada</p>
            )}
        </div>
    );
}
