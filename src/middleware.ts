import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Páginas que exigem login. As rotas de API transacionais se autoprotegem (rate limit +
// Zod + recálculo server-side + HMAC/internal-auth nos webhooks), então NÃO passam por
// aqui — o matcher antigo '/api/checkout(.*)' apontava para uma rota inexistente.
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/checkout(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    // Proteger rotas autenticadas
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
