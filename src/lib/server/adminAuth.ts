import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

/**
 * Gate de autorização do painel administrativo — SERVER-ONLY e fail-closed.
 *
 * O middleware (`/admin(.*)`) garante apenas que existe uma sessão; ele NÃO
 * distingue um cliente comum de um administrador. Este helper é o gate real e
 * precisa ser chamado no topo de todo `src/app/admin/**\/page.tsx`, ANTES de
 * qualquer query — Server Components são renderizados no servidor e o resultado
 * é serializado no payload RSC independentemente do que o layout cliente decida
 * pintar.
 *
 * Duas formas de conceder acesso (basta uma):
 *  1. `publicMetadata.role = "admin"` no usuário do Clerk. Exige que o session
 *     token do Clerk exponha o metadata — em Dashboard > Sessions > Customize
 *     session token, adicionar: { "metadata": "{{user.public_metadata}}" }.
 *  2. `ADMIN_USER_IDS` — lista de ids do Clerk separados por vírgula. Não exige
 *     nenhuma configuração no painel do Clerk.
 *
 * Sem nenhuma das duas configuradas, ninguém entra (fail-closed por design).
 */
function adminIdsFromEnv(): string[] {
    return (process.env.ADMIN_USER_IDS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Responde 404 (em vez de 403) para quem não é admin: não confirma sequer a
 * existência da rota para um curioso autenticado.
 *
 * @returns o userId do administrador, quando autorizado.
 */
export async function requireAdmin(): Promise<string> {
    const { userId, sessionClaims } = await auth();
    if (!userId) notFound();

    const role = (sessionClaims as { metadata?: { role?: string } } | null)?.metadata?.role;
    if (role === 'admin') return userId;

    if (adminIdsFromEnv().includes(userId)) return userId;

    notFound();
}
