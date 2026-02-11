
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        minimumCacheTTL: 60,
        formats: ['image/avif', 'image/webp'],
    },
    // Advanced Compiler Options
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    experimental: {
        optimizePackageImports: [
            'lucide-react',
        ],
    },
    // Security Headers for Production
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    // Content Security Policy - Proteção contra XSS
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel-insights.com https://*.supabase.co https://clerk.accounts.dev https://*.clerk.accounts.dev https://clerk.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https: https://img.clerk.com",
                            "connect-src 'self' https://*.supabase.co https://*.vercel-insights.com https://api.openai.com wss://*.supabase.co https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
                            "worker-src 'self' blob:",
                            "frame-src 'self' https://*.clerk.accounts.dev https://clerk.com",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "object-src 'none'",
                            "upgrade-insecure-requests",
                        ].join('; '),
                    },
                ],
            },
            // Cache headers for static images (1 year)
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // Cache headers for Next.js static assets (1 year)
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // Cache headers for fonts
            {
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
