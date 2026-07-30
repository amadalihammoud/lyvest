/**
 * Cobrança PIX transparente (sem redirecionar ao Asaas).
 *
 * Fluxo:
 *  1. Garante um customer (por e-mail)
 *  2. POST /payments billingType=PIX
 *  3. GET /payments/{id}/pixQrCode → encodedImage + payload
 */

import { formatGatewayErrors, resolveChargeValue, type AsaasItem } from './asaasPayload';
import { logError, logInfo } from '../../lib/server/logger';

export interface AsaasPixResult {
    paymentId: string;
    value: number;
    /** Base64 da imagem do QR (sem prefixo data:). */
    encodedImage: string;
    /** Copia e cola. */
    payload: string;
    expirationDate?: string;
}

function baseUrl(): string {
    return process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
}

function apiKey(): string {
    const key = process.env.ASAAS_API_KEY;
    if (!key) throw new Error('ASAAS_API_KEY ausente');
    return key;
}

function headers(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        access_token: apiKey(),
        'User-Agent': 'lyvest-ecommerce',
    };
}

function tomorrowIsoDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null }> {
    const res = await fetch(`${baseUrl()}${path}`, {
        ...init,
        headers: { ...headers(), ...(init?.headers as Record<string, string> | undefined) },
        cache: 'no-store',
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
}

/**
 * Cria ou reutiliza customer pelo e-mail.
 * Nome mínimo 2 chars (exigência Asaas).
 */
export async function ensureAsaasCustomer(input: {
    name: string;
    email: string;
    cpfCnpj?: string | null;
}): Promise<string> {
    const name = (input.name || 'Cliente LyVest').trim().slice(0, 100) || 'Cliente LyVest';
    const email = (input.email || 'checkout@lyvest.com.br').trim().toLowerCase();

    // Busca por e-mail para não duplicar
    const search = await asaasFetch<{ data?: Array<{ id?: string }> }>(
        `/customers?email=${encodeURIComponent(email)}&limit=1`
    );
    const existing = search.data?.data?.[0]?.id;
    if (existing) return existing;

    const body: Record<string, unknown> = { name, email, notificationDisabled: true };
    const doc = (input.cpfCnpj ?? '').replace(/\D/g, '');
    if (doc.length === 11 || doc.length === 14) body.cpfCnpj = doc;

    const created = await asaasFetch<{ id?: string; errors?: Array<{ code?: string; description?: string }> }>(
        '/customers',
        { method: 'POST', body: JSON.stringify(body) }
    );

    if (!created.ok || !created.data?.id) {
        const err = formatGatewayErrors(
            (created.data as { errors?: Array<{ code?: string; description?: string }> } | null)?.errors
        );
        logError(`asaas: falha ao criar customer (${created.status}) ${err}`);
        throw new Error('Falha ao registrar pagador no Asaas');
    }

    logInfo('asaas: customer criado', created.data.id);
    return created.data.id;
}

export async function createAsaasPixPayment(input: {
    customerId: string;
    items: AsaasItem[];
    amount?: number;
    orderId?: string;
    description?: string;
}): Promise<AsaasPixResult> {
    const value = resolveChargeValue(input.items, input.amount);

    const paymentBody: Record<string, unknown> = {
        customer: input.customerId,
        billingType: 'PIX',
        value,
        dueDate: tomorrowIsoDate(),
        description: (input.description || `Pedido LyVest`).slice(0, 500),
        externalReference: input.orderId || undefined,
    };

    const pay = await asaasFetch<{
        id?: string;
        errors?: Array<{ code?: string; description?: string }>;
    }>('/payments', { method: 'POST', body: JSON.stringify(paymentBody) });

    if (!pay.ok || !pay.data?.id) {
        const err = formatGatewayErrors(pay.data?.errors);
        logError(`asaas: falha ao criar cobrança PIX (${pay.status}) ${err}`);
        throw new Error('Falha ao criar cobrança PIX no Asaas');
    }

    const paymentId = pay.data.id;

    const qr = await asaasFetch<{
        encodedImage?: string;
        payload?: string;
        expirationDate?: string;
        errors?: Array<{ code?: string; description?: string }>;
    }>(`/payments/${paymentId}/pixQrCode`);

    if (!qr.ok || !qr.data?.encodedImage || !qr.data?.payload) {
        const err = formatGatewayErrors(qr.data?.errors);
        logError(`asaas: falha ao obter QR PIX (${qr.status}) ${err}`);
        throw new Error('Falha ao obter QR Code PIX');
    }

    logInfo('asaas: cobrança PIX criada', paymentId);

    return {
        paymentId,
        value,
        encodedImage: qr.data.encodedImage,
        payload: qr.data.payload,
        expirationDate: qr.data.expirationDate,
    };
}
