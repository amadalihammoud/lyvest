'use client';

import nextDynamic from 'next/dynamic';

/**
 * Landing do OAuth (Google) — /sso-callback
 *
 * BUG QUE ISTO CORRIGE
 * O <SignIn /> do AuthModal é montado sem `path`/`routing`, então o Clerk usa o
 * callback padrão em /sso-callback NO DOMÍNIO DA APLICAÇÃO. Essa rota não
 * existia: quem clicava em "Continuar com Google" no modal da loja terminava o
 * handshake com o Google e caía num 404 — login social não funcionava para
 * nenhum cliente.
 *
 * POR QUE O IMPORT É DINÂMICO COM ssr: false
 * AuthenticateWithRedirectCallback exige estar dentro de <ClerkProvider />, e
 * este projeto monta o provider sob demanda no cliente (ClientLayout) para não
 * arrastar ~200 KB de chunk para o bundle inicial. Renderizado no servidor, o
 * componente não encontra provider algum e lança — foi exatamente isso que
 * quebrou o build:
 *
 *   Error occurred prerendering page "/sso-callback"
 *   @clerk/clerk-react: AuthenticateWithRedirectCallback can only be used
 *   within the <ClerkProvider /> component
 *
 * Com ssr: false o componente só existe no cliente. E como /sso-callback está
 * em EAGER_CLERK_ROUTES (ClientLayout), o provider já montou quando o chunk
 * assíncrono termina de carregar — a própria latência do import garante a ordem.
 *
 * A rota fica fora do matcher do middleware de propósito: exigir sessão para
 * concluir o login seria circular.
 */
const AuthenticateWithRedirectCallback = nextDynamic(
    () =>
        import('@clerk/nextjs').then((m) => ({
            default: m.AuthenticateWithRedirectCallback,
        })),
    { ssr: false }
);

export default function SSOCallbackPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5EDE8]">
            <div className="flex flex-col items-center">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-[#7D2121]" />
                <p className="text-sm text-slate-500">Concluindo o login...</p>
            </div>
            <AuthenticateWithRedirectCallback
                signInFallbackRedirectUrl="/dashboard"
                signUpFallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}
