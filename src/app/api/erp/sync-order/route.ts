import { NextRequest, NextResponse } from 'next/server';

import { isAuthorizedInternal } from '@/lib/server/internalAuth';
import { logError } from '@/lib/server/logger';
import { getErpProvider } from '@/server/providers/erp';

/**
 * POST /api/erp/sync-order
 *
 * Sincroniza pedidos confirmados com o ERP. Pilar 3: auth interna fail-closed
 * (comparação em tempo constante), sem bypass em dev.
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (!isAuthorizedInternal(authHeader, `Bearer ${process.env.INTERNAL_API_KEY}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orderData = await request.json();
        const erpProvider = getErpProvider();
        const result = await erpProvider.sendOrder(orderData);
        return NextResponse.json(result);
    } catch (error) {
        logError('erp/sync-order: erro ao sincronizar', error);
        return NextResponse.json({ error: 'Erro ao sincronizar com ERP' }, { status: 500 });
    }
}
