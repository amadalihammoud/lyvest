import { describe, it, expect } from 'vitest';

import { validateCoupon, VALID_COUPONS } from './coupons';

describe('validateCoupon (fonte única de cupons — Pilar 1)', () => {
    it('rejeita código vazio', () => {
        const r = validateCoupon('', 100);
        expect(r.valid).toBe(false);
        expect(r.discount).toBe(0);
    });

    it('rejeita cupom inexistente', () => {
        const r = validateCoupon('NAOEXISTE', 100);
        expect(r.valid).toBe(false);
        expect(r.discount).toBe(0);
    });

    it('aceita cupom válido e retorna o desconto do servidor', () => {
        const r = validateCoupon('BEMVINDA10', 100);
        expect(r.valid).toBe(true);
        expect(r.discount).toBe(VALID_COUPONS.BEMVINDA10.discount);
    });

    it('normaliza caixa/espaços do código', () => {
        const r = validateCoupon('  promo5 ', 100);
        expect(r.valid).toBe(true);
        expect(r.discount).toBe(VALID_COUPONS.PROMO5.discount);
    });

    it('respeita o valor mínimo de carrinho (minCartTotal)', () => {
        const abaixo = validateCoupon('LYVEST2026', 10); // exige >= 50
        expect(abaixo.valid).toBe(false);

        const acima = validateCoupon('LYVEST2026', 60);
        expect(acima.valid).toBe(true);
        expect(acima.discount).toBe(VALID_COUPONS.LYVEST2026.discount);
    });

    it('sinaliza cupom de uso único (single-use) para reforço no checkout', () => {
        const r = validateCoupon('BEMVINDA10', 100);
        expect(r.singleUse).toBe(true);
    });
});
