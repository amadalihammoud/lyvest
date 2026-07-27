'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * Landing do OAuth (Google) — /sso-callback
 *
 * BUG QUE ISTO CORRIGE
 * O <SignIn /> do AuthModal é montado sem `path`/`routing`, então o Clerk usa o
 * callback padrão em /sso-callback NO DOMÍNIO DA APLICAÇÃO. Essa rota não
 * existia: quem clicava em "Continuar com Google" no modal da loja terminava o
 * handshake com o Google e caía num 404 — login social simplesmente não
 * funcionava para nenhum cliente.
 *
 * AuthenticateWithRedirectCallback finaliza o handshake e redireciona. Sem UI
 * própria de propósito: a permanência aqui é de milissegundos.
 *
 * Esta rota precisa ser pública — o matcher do middleware (dashboard, checkout,
 * admin) não a cobre, que é o correto: exigir sessão para completar o login
 * seria circular.
 */
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
