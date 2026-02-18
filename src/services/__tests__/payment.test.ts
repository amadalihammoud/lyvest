import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentService, paymentService } from '../payment';

// Mock logger
vi.mock('../../utils/logger', () => ({
    paymentLogger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock constants
vi.mock('../../config/constants', () => ({
    PAYMENT_CONFIG: {
        GATEWAYS: ['stripe', 'pagseguro', 'mercadopago'],
        DEFAULT_GATEWAY: 'mercadopago',
        PIX_DISCOUNT: 0.05,
    },
}));

describe('PaymentService', () => {
    let service: PaymentService;

    beforeEach(() => {
        service = new PaymentService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('initializes with default gateway', () => {
            const svc = new PaymentService();
            expect(svc).toBeInstanceOf(PaymentService);
        });
    });

    describe('setGateway', () => {
        it('sets a valid gateway', () => {
            expect(() => service.setGateway('stripe')).not.toThrow();
        });

        it('sets mercadopago gateway', () => {
            expect(() => service.setGateway('mercadopago')).not.toThrow();
        });

        it('sets pagseguro gateway', () => {
            expect(() => service.setGateway('pagseguro')).not.toThrow();
        });

        it('throws for unsupported gateway', () => {
            expect(() => service.setGateway('invalid')).toThrow('Gateway não suportado: invalid');
        });
    });

    describe('createPaymentSession', () => {
        const mockOrderData = {
            total: 199.90,
            items: [
                { id: 1, name: 'Lingerie', price: 99.95, quantity: 2 },
            ],
        };

        it('calls /api/payment/create-session endpoint', async () => {
            const mockSession = {
                sessionId: 'sess_123',
                checkoutUrl: '/checkout?session=123',
                status: 'pending',
            };

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: mockSession }),
            });

            // Mock window.location for the isLocalhost check
            Object.defineProperty(window, 'location', {
                value: { hostname: 'example.com' },
                writable: true,
            });

            const result = await service.createPaymentSession(mockOrderData);
            expect(result).toEqual(mockSession);
            expect(global.fetch).toHaveBeenCalledWith('/api/payment/create-session', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }));
        });

        it('falls back to mock on localhost 404', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({}),
            });

            Object.defineProperty(window, 'location', {
                value: { hostname: 'localhost' },
                writable: true,
            });

            const result = await service.createPaymentSession(mockOrderData);
            expect(result.sessionId).toContain('mock_sess_');
            expect(result.status).toBe('pending');
        });

        it('throws on non-404 server error', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'Server Error' }),
            });

            Object.defineProperty(window, 'location', {
                value: { hostname: 'example.com' },
                writable: true,
            });

            await expect(service.createPaymentSession(mockOrderData)).rejects.toThrow('Server Error');
        });
    });

    describe('processCardPayment', () => {
        it('returns approved payment result', async () => {
            const result = await service.processCardPayment('sess_123', {
                cardToken: 'tok_test',
                installments: 1,
            });

            expect(result.status).toBe('approved');
            expect(result.transactionId).toContain('txn_');
            expect(result.message).toBe('Pagamento aprovado com sucesso');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('generatePixCode', () => {
        it('returns PIX payment details with discount', async () => {
            const orderData = {
                total: 100,
                items: [{ id: 1, name: 'Test', price: 100, quantity: 1 }],
            };

            const result = await service.generatePixCode(orderData);

            expect(result.status).toBe('pending');
            expect(result.pixCode).toBeDefined();
            expect(result.qrCodeUrl).toBe('/pix-qr-placeholder.png');
            expect(result.amount).toBe(95); // 100 - 5% discount
            expect(result.discount).toBe(5); // 5% of 100
            expect(result.expiresAt).toBeDefined();
        });

        it('generates valid expiration time (30 minutes)', async () => {
            const before = Date.now();
            const result = await service.generatePixCode({
                total: 50,
                items: [{ id: 1, name: 'Test', price: 50, quantity: 1 }],
            });

            const expiresAt = new Date(result.expiresAt!).getTime();
            const thirtyMinutes = 30 * 60 * 1000;
            expect(expiresAt).toBeGreaterThanOrEqual(before + thirtyMinutes - 2000);
        });
    });

    describe('checkPaymentStatus', () => {
        it('returns approved status', async () => {
            const result = await service.checkPaymentStatus('txn_123');

            expect(result.transactionId).toBe('txn_123');
            expect(result.status).toBe('approved');
        });
    });

    describe('requestRefund', () => {
        it('returns pending refund with full amount', async () => {
            const result = await service.requestRefund('txn_123');

            expect(result.refundId).toContain('ref_');
            expect(result.transactionId).toBe('txn_123');
            expect(result.amount).toBeNull();
            expect(result.status).toBe('pending');
        });

        it('returns pending refund with partial amount', async () => {
            const result = await service.requestRefund('txn_123', 50);

            expect(result.amount).toBe(50);
            expect(result.status).toBe('pending');
            expect(result.message).toContain('7 dias úteis');
        });
    });

    describe('singleton', () => {
        it('exports a singleton instance', () => {
            expect(paymentService).toBeInstanceOf(PaymentService);
        });
    });
});
