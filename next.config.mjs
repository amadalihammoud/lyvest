/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'lyvest.vercel.app',
            },
        ],
        minimumCacheTTL: 31536000,
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    // Advanced Compiler Options
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error'],
        } : false,
        reactRemoveProperties: process.env.NODE_ENV === 'production',
    },
    // Silence Turbopack warning/error by acknowledging it (even if empty)
    // or rely on webpack config.
    // Note: Vercel/Next16 defaults to Turbo. providing empty object helps validation
    // turbopack: {}, <-- Actually, if we use webpack config, we might want to ensure we don't conflict.
    // The error said: "simply setting an empty turbopack config...". Let's try that.
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@clerk/nextjs',
            '@supabase/supabase-js',
            'framer-motion',
            'date-fns',
            'lodash',
            'canvas-confetti',
            '@sentry/react',
            'zod',
            'react-hook-form'
        ],
        // turbopack: {} // Moved inside experimental? No, usually top level or specific flag.
        // Wait, Next.js config schema: turbopack is usually not in experimental in newer versions?
        // Let's try placing it at root if allowed, or check docs.
        // Actually, the error says "in your Next config file (e.g. `turbopack: {}`)".
        // It likely implies top-level.
    },
    // Webpack Optimization for Chunk Splitting
    webpack: (config, { isServer, dev }) => {
        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    framework: {
                        name: 'framework',
                        test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                        priority: 40,
                        enforce: true,
                    },
                    lib: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                            const packageName = match ? match[1] : 'vendor';
                            return `npm.${packageName.replace('@', '')}`;
                        },
                        priority: 30,
                        minChunks: 1,
                        reuseExistingChunk: true,
                    },
                    commons: {
                        name: 'commons',
                        minChunks: 2,
                        priority: 20,
                    },
                },
            };
        }
        return config;
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
                        value: 'max-age=31536000; includeSubDomains; preload',
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
            // Cache extensions
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
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
