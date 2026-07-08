import { NextResponse } from 'next/server';

/**
 * Health Check — GET /api/status
 */
export const dynamic = 'force-dynamic';

export function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'LyVest API',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || 'development',
    });
}
