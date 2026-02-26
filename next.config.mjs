/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    poweredByHeader: false,

    // Do not expose source maps to end users in production builds.
    // Source maps for error tracking should be uploaded to Sentry during CI/CD,
    // not served publicly. This fixes the "valid-source-maps" Lighthouse audit
    // and slightly reduces the build output size.
    productionBrowserSourceMaps: false,

    // Images: Otimização extrema
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1400, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128],
        minimumCacheTTL: 31536000,
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
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },

    // Experimental: Otimizações máximas
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@clerk/nextjs',
            '@supabase/supabase-js',
            'framer-motion',
            '@sentry/react',
            'zod',
            'canvas-confetti',
            'react-markdown',
            'ai',
            '@ai-sdk/openai',
            '@ai-sdk/react',
        ],
        optimizeCss: true,
    },

    turbopack: {},
    // Webpack: Removido custom splitChunks para evitar conflito com dynamic imports e permitir que o Next.js lide com isso nativamente
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Remover polyfills desnecessários no client
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };

            // ── Alias legacy Array polyfills to native equivalents ──────────────
            // Some transitive dependencies import core-js polyfills for Array.at
            // and Array.from. Since ALL our browserslist targets (Chrome ≥ 95,
            // Safari ≥ 15.4, Firefox ≥ 95, Edge ≥ 95) support these methods
            // natively, we alias those polyfill entry-points to `false` (empty
            // module). This removes ~24 KiB from the JS payload and eliminates
            // the "Legacy JavaScript" Lighthouse warning without touching any
            // runtime code.
            config.resolve.alias = {
                ...config.resolve.alias,
                'core-js/modules/es.array.at': false,
                'core-js/modules/es.array.from': false,
                'core-js/stable/array/at': false,
                'core-js/stable/array/from': false,
                'core-js/features/array/at': false,
                'core-js/features/array/from': false,
            };
        }
        return config;
    },

    // Advanced Compiler Options
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error'],
        } : false,
        reactRemoveProperties: process.env.NODE_ENV === 'production',
    },

    generateEtags: true,

    httpAgentOptions: {
        keepAlive: true,
    },

    // Security Headers for Production
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, stale-while-revalidate=604800, immutable',
                    },
                ],
            },
            {
                source: '/:all*(woff|woff2|ttf|eot)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/:path*.html',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                ],
            },
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '0',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
