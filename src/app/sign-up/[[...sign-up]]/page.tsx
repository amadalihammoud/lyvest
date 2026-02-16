'use client';

import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { useUltraLazyLoad } from "@/lib/ultra-lazy-load";

function SignUpPageContent() {
    return (
        <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
            <div className="w-full max-w-[480px]">
                <SignUp
                    path="/sign-up"
                    routing="path"
                    signInUrl="/sign-in"
                    forceRedirectUrl="/dashboard"
                    appearance={{
                        elements: {
                            card: "shadow-xl border-none p-8 rounded-2xl bg-white",
                            headerTitle: "text-[#9F1239] text-xl mb-1",
                            headerSubtitle: "text-slate-500 text-sm",
                            socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50 text-slate-600",
                            formButtonPrimary: "bg-[#9F1239] hover:bg-[#881337] text-white rounded-lg",
                            footerActionLink: "text-[#9F1239] hover:text-[#881337]"
                        }
                    }}
                />
            </div>
        </div>
    );
}

function SignUpSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9F1239] mb-4"></div>
            <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
    );
}

export default function SignUpPage() {
    const shouldLoad = useUltraLazyLoad();

    if (!shouldLoad) {
        return <SignUpSkeleton />;
    }

    return (
        <Suspense fallback={<SignUpSkeleton />}>
            <SignUpPageContent />
        </Suspense>
    );
}
