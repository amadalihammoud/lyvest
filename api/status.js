/* global process */
/**
 * Health Check Endpoint
 * GET /api/status
 */
export default function handler(req, res) {
    const timestamp = new Date().toISOString();

    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).json({
        status: 'ok',
        service: 'Tutti & Nino API',
        timestamp,
        environment: process.env.VERCEL_ENV || 'development'
    });
}
