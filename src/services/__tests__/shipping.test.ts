import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShippingService, shippingService } from '../shipping';

// Mock logger
vi.mock('../../utils/logger', () => ({
    shippingLogger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock constants
vi.mock('../../config/constants', () => ({
    SHIPPING_CONFIG: {
        FREE_SHIPPING_THRESHOLD: 150,
        DEFAULT_SHIPPING_COST: 15.90,
    },
}));

describe('ShippingService', () => {
    let service: ShippingService;

    beforeEach(() => {
        service = new ShippingService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('calculateShipping', () => {
        const mockItems = [
            { id: 1, name: 'Lingerie', price: 99.90, qty: 1 },
        ];

        it('calls /api/shipping/calculate endpoint', async () => {
            const mockOptions = [
                {
                    id: 'pac',
                    carrier: 'Correios',
                    service: 'PAC',
                    price: 15.90,
                    originalPrice: 15.90,
                    deliveryDays: 7,
                    deliveryRange: '5 a 9 dias úteis',
                    isFree: false,
                },
            ];

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockOptions),
            });

            Object.defineProperty(window, 'location', {
                value: { hostname: 'example.com' },
                writable: true,
            });

            const result = await service.calculateShipping('01001000', mockItems);
            expect(result).toEqual(mockOptions);
            expect(global.fetch).toHaveBeenCalledWith('/api/shipping/calculate', expect.objectContaining({
                method: 'POST',
            }));
        });

        it('returns mock shipping on localhost 404', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            Object.defineProperty(window, 'location', {
                value: { hostname: 'localhost' },
                writable: true,
            });

            const result = await service.calculateShipping('01001000', mockItems);
            expect(result).toHaveLength(1);
            expect(result[0].carrier).toBe('Correios');
            expect(result[0].service).toContain('PAC');
        });

        it('applies free shipping when total >= threshold', async () => {
            global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

            Object.defineProperty(window, 'location', {
                value: { hostname: 'example.com' },
                writable: true,
            });

            const expensiveItems = [
                { id: 1, name: 'Lingerie', price: 200, qty: 1 },
            ];

            const result = await service.calculateShipping('01001000', expensiveItems);
            expect(result[0].price).toBe(0);
            expect(result[0].isFree).toBe(true);
        });

        it('charges shipping when total < threshold', async () => {
            global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

            Object.defineProperty(window, 'location', {
                value: { hostname: 'example.com' },
                writable: true,
            });

            const cheapItems = [
                { id: 1, name: 'Calcinha', price: 29.90, qty: 1 },
            ];

            const result = await service.calculateShipping('01001000', cheapItems);
            expect(result[0].price).toBe(15.90);
            expect(result[0].isFree).toBe(false);
        });
    });

    describe('trackOrder', () => {
        it('returns tracking history', async () => {
            const result = await service.trackOrder('BR123456789');

            expect(result.trackingCode).toBe('BR123456789');
            expect(result.carrier).toBe('Correios');
            expect(result.status).toBe('in_transit');
            expect(result.events).toHaveLength(3);
        });

        it('returns events in chronological order', async () => {
            const result = await service.trackOrder('BR123456789');

            expect(result.events[0].status).toBe('in_transit');
            expect(result.events[1].status).toBe('processed');
            expect(result.events[2].status).toBe('posted');
        });

        it('includes estimated delivery date', async () => {
            const result = await service.trackOrder('BR123456789');
            const estimatedDate = new Date(result.estimatedDelivery);
            expect(estimatedDate.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('validateCep', () => {
        it('returns address for valid CEP', async () => {
            const result = await service.validateCep('01001000');

            expect(result.cep).toBe('01001000');
            expect(result.city).toBe('São Paulo');
            expect(result.state).toBe('SP');
        });

        it('accepts CEP with hyphen', async () => {
            const result = await service.validateCep('01001-000');
            expect(result.cep).toBe('01001000');
        });

        it('throws for invalid CEP', async () => {
            await expect(service.validateCep('123')).rejects.toThrow('CEP inválido');
        });

        it('throws for empty CEP', async () => {
            await expect(service.validateCep('')).rejects.toThrow('CEP inválido');
        });
    });

    describe('isFreeShipping', () => {
        it('returns true when total >= threshold', () => {
            expect(service.isFreeShipping(150)).toBe(true);
            expect(service.isFreeShipping(200)).toBe(true);
        });

        it('returns false when total < threshold', () => {
            expect(service.isFreeShipping(149.99)).toBe(false);
            expect(service.isFreeShipping(0)).toBe(false);
        });
    });

    describe('getFreeShippingThreshold', () => {
        it('returns the configured threshold', () => {
            expect(service.getFreeShippingThreshold()).toBe(150);
        });
    });

    describe('singleton', () => {
        it('exports a singleton instance', () => {
            expect(shippingService).toBeInstanceOf(ShippingService);
        });
    });
});
