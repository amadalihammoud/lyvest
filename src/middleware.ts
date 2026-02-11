import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

export default clerkMiddleware(async (auth, req) => {
    // Proteger rotas autenticadas
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Headers de Segurança (Mantendo o hardening anterior)
    const response = NextResponse.next();
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
});


import type { NextRequest } from 'next/server';

/**
 * Rate Limiting Configuration
 * Simple in-memory rate limiter for Edge Runtime
 * For production at scale, use Redis or similar
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
    // Vercel/Cloudflare headers
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
        // New window
        ipRequestCounts.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT.windowMs,
        });
        return false;
    }

    record.count++;

    if (record.count > RATE_LIMIT.maxRequests) {
        return true;
    }

    return false;
}

/**
 * Detect potential bot/malicious requests
 */
function isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;

    // Block common attack patterns
    const suspiciousPatterns = [
        /\.env/i,
        /\.git/i,
        /wp-admin/i,
        /wp-login/i,
        /phpMyAdmin/i,
        /\.php$/i,
        /\.asp$/i,
        /\.aspx$/i,
        /config\./i,
        /passwd/i,
        /etc\/shadow/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(path))) {
        return true;
    }

    // Block empty or suspicious user agents
    if (!userAgent || userAgent.length < 10) {
        return true;
    }

    // Block common bad bots
    const badBots = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab'];
    if (badBots.some(bot => userAgent.toLowerCase().includes(bot))) {
        return true;
    }

    return false;
}

/**
 * Middleware for security protections
 */
export function middleware(request: NextRequest) {
    const ip = getClientIP(request);
    const path = request.nextUrl.pathname;

    // Skip middleware for static assets
    if (
        path.startsWith('/_next/') ||
        path.startsWith('/images/') ||
        path.startsWith('/fonts/') ||
        path.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check for suspicious requests
    if (isSuspiciousRequest(request)) {
        console.warn(`[SECURITY] Blocked suspicious request from ${ip}: ${path}`);
        return new NextResponse('Forbidden', { status: 403 });
    }

    // 3. Rate Limiting for API routes
    if (path.startsWith('/api/')) {
        if (isRateLimited(ip)) {
            console.warn(`[SECURITY] Rate limited IP: ${ip}`);
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': '60',
                },
            });
        }
    }

    // 4. CSRF & Origin Validation for API mutations
    // Protege rotas de API contra solicitações de origens desconhecidas
    if (path.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        // Allow requests from same host or null (server-to-server often null, but browser mutations strictly have origin)
        if (origin && host && !origin.includes(host)) {
            console.warn(`[SECURITY] Cross-origin request blocked from ${origin} to ${host}`);
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    const response = NextResponse.next();

    // 5. Security Headers (Defense in Depth)
    // Mesmo configurados no next.config.js, forçar aqui garante aplicação em Edge
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

/**
 * Matcher configuration
 * Apply middleware to all routes except static files
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
