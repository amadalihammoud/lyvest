import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Exige sessão. Para /admin isto é apenas a primeira camada: a checagem de
// papel fica em requireAdmin() (src/lib/server/adminAuth.ts), chamada no topo
// de cada page.tsx do painel — o middleware não distingue cliente de admin.
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/checkout(.*)',
    '/api/checkout(.*)',
    '/admin(.*)'
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
