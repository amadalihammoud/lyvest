import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Exige sessão. Para /admin isto é apenas a primeira camada: a checagem de
// papel fica em requireAdmin() (src/lib/server/adminAuth.ts), chamada no topo
// de cada page.tsx do painel — o middleware não distingue cliente de admin.
//
// Checkout NÃO é protegido: convidados podem comprar (guest_email no create_order).
// Dashboard e admin continuam exigindo login.
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
