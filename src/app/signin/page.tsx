import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
            {!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro de Configuração: </strong>
                    <span className="block sm:inline">Chave pública do Clerk não encontrada. Verifique as variáveis de ambiente na Vercel.</span>
                </div>
            )}
            <div className="w-full max-w-md">
                <SignIn path="/signin" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
            </div>
        </div>
    );
}
