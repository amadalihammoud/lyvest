/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    poweredByHeader: false,

    // Images: Otimização extrema
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128],
        minimumCacheTTL: 31536000,
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
    },

    // Experimental: Otimizações máximas
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
            'react-hook-form',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-slot',
        ],

        gzipSize: true,
    },

    // Webpack: Usar defaults do Next.js + Lazy Loading já resolvem
    // Removido custom splitChunks para evitar conflito com dynamic imports
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Remover polyfills desnecessários no client
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };

            // Code Splitting Agressivo (Optimization 8)
            config.optimization.splitChunks = {
                chunks: 'all',
                maxInitialRequests: 25,
                minSize: 20000,
                cacheGroups: {
                    clerk: {
                        test: /[\\/]node_modules[\\/]@clerk[\\/]/,
                        name: 'clerk',
                        priority: 20,
                        reuseExistingChunk: true,
                    },
                    commons: {
                        name: 'commons',
                        chunks: 'all',
                        minChunks: 2,
                        priority: 10,
                    },
                    lib: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            const packageName = module.context.match(
                                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                            )?.[1];
                            return `npm.${packageName?.replace('@', '')}`;
                        },
                        priority: 5,
                        reuseExistingChunk: true,
                    },
                },
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
        emotion: false,
        styledComponents: false,
    },

    output: 'standalone',
    generateEtags: true,

    httpAgentOptions: {
        keepAlive: true,
    },

    // Security Headers for Production
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2|ttf|eot)',
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
                        value: '1; mode=block',
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
