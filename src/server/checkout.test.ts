import { describe, expect, it } from 'vitest';

import {
    buildCreateOrderParams,
    buildSessionMetadata,
    normalizeCreateOrderResult,
    usesInvertedOrderFlow,
} from './checkout';

const semCupom = { code: null, discount: 0, singleUse: false, minCartTotal: null };

describe('buildCreateOrderParams', () => {
    it('monta o payload de um pedido de usuário logado', () => {
        expect(
            buildCreateOrderParams({
                userId: 'user_123',
                items: [{ id: 'p1', quantity: 2, variantId: 'v1' }],
                coupon: { code: 'BEMVINDA10', discount: 0.1, singleUse: true, minCartTotal: 100 },
                paymentMethod: 'pix',
                shipping: { cep: '01001000' },
            })
        ).toEqual({
            userId: 'user_123',
            items: [{ id: 'p1', quantity: 2, variantId: 'v1' }],
            couponCode: 'BEMVINDA10',
            discount: 0.1,
            singleUse: true,
            minCartTotal: 100,
            paymentMethod: 'pix',
            shipping: { cep: '01001000' },
            guestEmail: null,
        });
    });

    // products.id é uuid; um número aqui estoura com "invalid input syntax for
    // type uuid" e vira 500 genérico.
    it('converte id numérico para string', () => {
        const p = buildCreateOrderParams({ userId: null, items: [{ id: 7, quantity: 1 }], coupon: semCupom });
        expect(p.items[0].id).toBe('7');
    });

    // A função SQL distingue "não mandou" de "mandou vazio" para decidir se
    // exige a variante.
    it('variantId ausente vira null explícito, não undefined', () => {
        const p = buildCreateOrderParams({ userId: null, items: [{ id: 'p1', quantity: 1 }], coupon: semCupom });
        expect(p.items[0].variantId).toBeNull();
    });

    it('método de pagamento ausente vira "unknown"', () => {
        const p = buildCreateOrderParams({ userId: 'u', items: [{ id: 'p', quantity: 1 }], coupon: semCupom });
        expect(p.paymentMethod).toBe('unknown');
    });

    it('shipping ausente vira null', () => {
        const p = buildCreateOrderParams({ userId: 'u', items: [{ id: 'p', quantity: 1 }], coupon: semCupom });
        expect(p.shipping).toBeNull();
    });

    describe('guestEmail', () => {
        const convidado = (customerEmail?: string) =>
            buildCreateOrderParams({
                userId: null,
                items: [{ id: 'p', quantity: 1 }],
                coupon: semCupom,
                customerEmail,
            }).guestEmail;

        it('usa o e-mail do convidado quando informado', () => {
            expect(convidado('maria@x.com')).toBe('maria@x.com');
        });

        // guest_email é o único vínculo com um pedido sem conta; null tornaria
        // o pedido irrastreável.
        it('convidado sem e-mail recebe o endereço genérico', () => {
            expect(convidado(undefined)).toBe('guest@lyvest.com.br');
            expect(convidado('')).toBe('guest@lyvest.com.br');
        });

        it('usuário logado nunca tem guestEmail, mesmo mandando um', () => {
            const p = buildCreateOrderParams({
                userId: 'user_1',
                items: [{ id: 'p', quantity: 1 }],
                coupon: semCupom,
                customerEmail: 'maria@x.com',
            });
            expect(p.guestEmail).toBeNull();
        });
    });
});

describe('normalizeCreateOrderResult', () => {
    // A função SQL é a autoridade final de preço: lê a variante quando existe e
    // aplica o cupom na mesma transação que baixa estoque.
    it('o total da função SQL vence o calculado localmente', () => {
        expect(normalizeCreateOrderResult({ orderId: 'o1', total: 299.8 }, 149.9)).toEqual({
            orderId: 'o1',
            total: 299.8,
        });
    });

    it('mantém o total local quando a função não devolve número', () => {
        expect(normalizeCreateOrderResult({ orderId: 'o1' }, 149.9).total).toBe(149.9);
        expect(normalizeCreateOrderResult({ orderId: 'o1', total: '299.80' }, 149.9).total).toBe(149.9);
        expect(normalizeCreateOrderResult(null, 149.9).total).toBe(149.9);
        expect(normalizeCreateOrderResult(undefined, 149.9).total).toBe(149.9);
    });

    // Zero é um total válido (pedido 100% coberto por cupom) e não pode cair no
    // fallback.
    it('total zero é preservado, não trocado pelo fallback', () => {
        expect(normalizeCreateOrderResult({ orderId: 'o1', total: 0 }, 149.9).total).toBe(0);
    });

    it('orderId ausente ou vazio vira null', () => {
        expect(normalizeCreateOrderResult({}, 10).orderId).toBeNull();
        expect(normalizeCreateOrderResult({ orderId: '' }, 10).orderId).toBeNull();
        expect(normalizeCreateOrderResult(null, 10).orderId).toBeNull();
    });

    it('converte orderId não-string para string', () => {
        expect(normalizeCreateOrderResult({ orderId: 42 }, 10).orderId).toBe('42');
    });
});

describe('buildSessionMetadata', () => {
    const base = {
        userId: 'user_1',
        appliedCoupon: 'BEMVINDA10',
        orderId: 'o1',
        originHeader: 'https://www.lyvest.com.br',
        requestUrl: 'https://www.lyvest.com.br/api/payment/create-session',
    };

    it('monta o metadata completo', () => {
        expect(buildSessionMetadata(base)).toEqual({
            source: 'lyvest',
            verified: 'true',
            userId: 'user_1',
            coupon: 'BEMVINDA10',
            orderId: 'o1',
            appUrl: 'https://www.lyvest.com.br',
        });
    });

    // Gateways achatam metadata para texto: um null viraria a string "null" na
    // volta, e o webhook procuraria um pedido com esse id.
    it('nunca emite null — ausência vira string vazia', () => {
        const m = buildSessionMetadata({ ...base, appliedCoupon: null, orderId: null });
        expect(m.coupon).toBe('');
        expect(m.orderId).toBe('');
        expect(Object.values(m).every((v) => typeof v === 'string')).toBe(true);
    });

    it('convidado é identificado como "guest"', () => {
        expect(buildSessionMetadata({ ...base, userId: null }).userId).toBe('guest');
    });

    // No preview da Vercel o host muda a cada branch; NEXT_PUBLIC_APP_URL
    // apontaria para o lugar errado.
    it('cai para a origem da URL do request quando não há header Origin', () => {
        expect(buildSessionMetadata({ ...base, originHeader: null }).appUrl)
            .toBe('https://www.lyvest.com.br');
    });
});

describe('usesInvertedOrderFlow', () => {
    it('só o asaas usa o fluxo invertido', () => {
        expect(usesInvertedOrderFlow('asaas')).toBe(true);
        expect(usesInvertedOrderFlow('ASAAS')).toBe(true);
        expect(usesInvertedOrderFlow('  ')).toBe(false);
    });

    // Sem provedor configurado o padrão é mock, que mantém o fluxo legado —
    // inverter ali criaria pedido duplicado.
    it('ausente vira mock, que NÃO inverte', () => {
        expect(usesInvertedOrderFlow(undefined)).toBe(false);
        expect(usesInvertedOrderFlow('')).toBe(false);
        expect(usesInvertedOrderFlow('mock')).toBe(false);
    });
});
