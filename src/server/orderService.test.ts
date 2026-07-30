import { describe, expect, it } from 'vitest';

import { AMOUNT_TOLERANCE } from './orderService';

describe('AMOUNT_TOLERANCE', () => {
    it('aceita diferença de centavos típica', () => {
        const expected = 100.1;
        const received = 100.12;
        expect(Math.abs(received - expected) <= AMOUNT_TOLERANCE).toBe(true);
    });

    it('rejeita divergência material', () => {
        expect(Math.abs(50 - 49) > AMOUNT_TOLERANCE).toBe(true);
    });
});
