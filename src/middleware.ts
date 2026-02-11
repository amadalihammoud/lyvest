import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

// Rotas protegidas (apenas usuários logados)
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/checkout(.*)',
    '/api/checkout(.*)'
]);

// Rotas de administração (futuro)
const isAdminRoute = createRouteMatcher([
    '/admin(.*)'
]);

/**
 * Rate Limiting Configuration
 * Simple in-memory rate limiter for Edge Runtime
 */
const RATE_LIMIT = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute per IP
};

// In-memory store for rate limiting (resets on deploy)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');
    return cfIP || realIP || forwarded?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Check if request is rate limited
 */
function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = ipRequestCounts.get(ip);

    if (!record || now > record.resetTime) {
        ipRequestCounts.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT.windowMs,
        });
        return false;
    }

    record.count++;
    return record.count > RATE_LIMIT.maxRequests;
}

/**
 * Detect potential bot/malicious requests
 */
function isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;

    const suspiciousPatterns = [
        /\.env/i, /\.git/i, /wp-admin/i, /wp-login/i, /phpMyAdmin/i,
        /\.php$/i, /\.asp$/i, /\.aspx$/i, /config\./i, /passwd/i,
        /etc\/shadow/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(path))) {
        return true;
    }

    if (!userAgent || userAgent.length < 10) {
        return true;
    }

    const badBots = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab'];
    if (badBots.some(bot => userAgent.toLowerCase().includes(bot))) {
        return true;
    }

    return false;
}

export default clerkMiddleware(async (auth, req) => {
    const ip = getClientIP(req);
    const path = req.nextUrl.pathname;

    // 1. Skip checks for static assets
    if (
        path.startsWith('/_next/') ||
        path.startsWith('/images/') ||
        path.startsWith('/fonts/') ||
        path.includes('.')
    ) {
        return NextResponse.next();
    }

    // 2. Security: Block suspicious requests
    if (isSuspiciousRequest(req)) {
        console.warn(`[SECURITY] Blocked suspicious request from ${ip}: ${path}`);
        return new NextResponse('Forbidden', { status: 403 });
    }

    // 3. Rate Limiting for API routes
    if (path.startsWith('/api/')) {
        if (isRateLimited(ip)) {
            console.warn(`[SECURITY] Rate limited IP: ${ip}`);
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: { 'Retry-After': '60' },
            });
        }
    }

    // 4. CSRF protection for API mutations
    if (path.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const origin = req.headers.get('origin');
        const host = req.headers.get('host');
        if (origin && host && !origin.includes(host)) {
            console.warn(`[SECURITY] Cross-origin request blocked from ${origin} to ${host}`);
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    // 5. Auth Protection
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // 6. Security Headers
    const response = NextResponse.next();
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
});

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
