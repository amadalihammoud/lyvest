import { SignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Login Ly Vest</h1>

            <ClerkLoading>
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mb-4"></div>
                    <p className="text-slate-500">Carregando sistema de login...</p>
                </div>
            </ClerkLoading>

            <ClerkLoaded>
                <div className="w-full max-w-md">
                    <SignIn path="/signin" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
                </div>
            </ClerkLoaded>

            {!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                <p className="mt-8 text-red-500 font-bold">Erro Fatal: API Key não encontrada</p>
            )}
        </div>
    );
}
