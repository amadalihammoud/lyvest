/* global process */
/**
 * Helper de CORS para as funções serverless da Vercel.
 * Allowlist derivada de variáveis de ambiente (nunca hardcode de domínios de terceiros).
 *
 * Configure em produção:
 *   - NEXT_PUBLIC_APP_URL      (ex.: https://lyvest.com.br)
 *   - CORS_ALLOWED_ORIGINS     (opcional, lista separada por vírgula p/ origens extras)
 */
function getAllowedOrigins() {
    const origins = new Set();

    // Origem canônica do app
    if (process.env.NEXT_PUBLIC_APP_URL) origins.add(process.env.NEXT_PUBLIC_APP_URL.trim());

    // Origens extras explícitas (ex.: domínio Vercel de preview)
    if (process.env.CORS_ALLOWED_ORIGINS) {
        for (const o of process.env.CORS_ALLOWED_ORIGINS.split(',')) {
            const v = o.trim();
            if (v) origins.add(v);
        }
    }

    // Localhost apenas fora de produção (dev do Next.js)
    if (process.env.NODE_ENV !== 'production') {
        origins.add('http://localhost:3000');
        origins.add('http://localhost:5173');
    }

    return origins;
}

export default function allowCors(fn) {
    return async (req, res) => {
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        const allowed = getAllowedOrigins();
        const origin = req.headers.origin;
        if (origin && allowed.has(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
        }
        // Sem wildcard '*': origens fora da allowlist simplesmente não recebem o header.

        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
        );

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        return await fn(req, res);
    };
}
