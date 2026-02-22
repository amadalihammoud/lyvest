import { currentUser } from '@clerk/nextjs/server';

import HeaderInteractive, { SerializedUser } from './HeaderInteractive';

export default async function Header() {
    // 1. Edge Middleware checks auth via Cookie (Fast, no JS on client)
    // 2. Server Component fetches the current user details securely
    const user = await currentUser();

    // 3. Serialize only the necessary data to pass to the Client Component
    // This keeps the Clerk SDK entirely out of the client bundle for anonymous users!
    const serializedUser: SerializedUser | null = user ? {
        id: user.id,
        fullName: user.fullName || user.firstName || 'Usuário',
        imageUrl: user.imageUrl,
    } : null;

    // 4. Render the interactive part of the header, which is now lightweight
    return <HeaderInteractive user={serializedUser} />;
}
