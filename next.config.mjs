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
        optimizeFonts: true,
        gzipSize: true,
    },

    // Webpack: Code splitting agressivo
    webpack: (config, { isServer, dev }) => {
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                minimize: true,
                usedExports: true,
                concatenateModules: true,
                sideEffects: true,

                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,

                        framework: {
                            name: 'framework',
                            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                            priority: 50,
                            enforce: true,
                            reuseExistingChunk: true,
                        },

                        clerk: {
                            name: 'clerk',
                            test: /[\\/]node_modules[\\/](@clerk)[\\/]/,
                            priority: 45,
                            enforce: true,
                            reuseExistingChunk: true,
                        },

                        sentry: {
                            name: 'sentry',
                            test: /[\\/]node_modules[\\/](@sentry)[\\/]/,
                            priority: 45,
                            enforce: true,
                            reuseExistingChunk: true,
                        },

                        supabase: {
                            name: 'supabase',
                            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
                            priority: 45,
                            enforce: true,
                            reuseExistingChunk: true,
                        },

                        ui: {
                            name: 'ui',
                            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
                            priority: 40,
                            reuseExistingChunk: true,
                        },

                        lib: {
                            test: /[\\/]node_modules[\\/]/,
                            name(module) {
                                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)
                                const packageName = match ? match[1] : 'vendor'
                                return `npm.${packageName.replace('@', '').substring(0, 20)}`
                            },
                            priority: 30,
                            minChunks: 1,
                            maxSize: 244000,
                            reuseExistingChunk: true,
                        },

                        commons: {
                            name: 'commons',
                            minChunks: 2,
                            priority: 20,
                            maxSize: 122000,
                            reuseExistingChunk: true,
                        },
                    },
                },

                runtimeChunk: {
                    name: 'runtime',
                },

                moduleIds: 'deterministic',
                chunkIds: 'deterministic',
            }

            if (process.env.NODE_ENV === 'production') {
                config.devtool = false
            }
        }

        return config
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
