/**
 * Helper to handle CORS headers for Vercel Serverless Functions
 * Allows requests from your frontend domain (and localhost for dev)
 */
export default function allowCors(fn) {
    return async (req, res) => {
        res.setHeader('Access-Control-Allow-Credentials', true)
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:4173',
            'https://tuttiandnino.vercel.app',
            'https://ecommerce-tutti-nino-rgtg.vercel.app'
        ];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        // res.setHeader('Access-Control-Allow-Origin', '*') // Removed wildcard for security
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )

        if (req.method === 'OPTIONS') {
            res.status(200).end()
            return
        }

        return await fn(req, res)
    }
}
