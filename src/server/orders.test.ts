import { describe, expect, it } from 'vitest';

import { couponRuleFor, messageForRpcError } from './orders';

/**
 * Helpers compartilhados por /api/orders e /api/payment/create-session.
 * São o ponto onde o desconto do cupom é resolvido NO SERVIDOR — o cliente só
 * manda o código. Um erro aqui vira desconto indevido em toda venda.
 */
describe('couponRuleFor (regra de cupom resolvida no servidor)', () => {
    it('devolve regra zerada quando não há código', () => {
        expect(couponRuleFor(undefined)).toEqual({
            code: null, discount: 0, singleUse: false, minCartTotal: 0,
        });
    });

    it('devolve regra zerada para cupom inexistente', () => {
        expect(couponRuleFor('NAOEXISTE')).toEqual({
            code: null, discount: 0, singleUse: false, minCartTotal: 0,
        });
    });

    it('normaliza caixa e espaços antes de resolver', () => {
        expect(couponRuleFor('  promo5 ').code).toBe('PROMO5');
        expect(couponRuleFor('  promo5 ').discount).toBe(0.05);
    });

    it('propaga singleUse do cupom de boas-vindas', () => {
        const r = couponRuleFor('BEMVINDA10');
        expect(r.singleUse).toBe(true);
        expect(r.discount).toBe(0.1);
    });

    it('propaga minCartTotal quando o cupom exige mínimo', () => {
        expect(couponRuleFor('LYVEST2026').minCartTotal).toBe(50);
    });

    it('nunca devolve desconto quando o código não resolve — cliente não escolhe desconto', () => {
        for (const entrada of ['', '   ', 'DROP TABLE', '0.99', 'bemvinda10x']) {
            expect(couponRuleFor(entrada).discount).toBe(0);
        }
    });
});

describe('messageForRpcError (erro do Postgres -> resposta segura)', () => {
    it('estoque insuficiente vira 409 acionável', () => {
        const r = messageForRpcError('INSUFFICIENT_STOCK:9f1c...');
        expect(r.status).toBe(409);
        expect(r.message).toMatch(/estoque/i);
    });

    it('produto inexistente vira 400', () => {
        expect(messageForRpcError('PRODUCT_NOT_FOUND:abc').status).toBe(400);
    });

    it('cupom já usado vira 409 (violação da UNIQUE de coupon_redemptions)', () => {
        expect(messageForRpcError('duplicate key value violates unique constraint').status).toBe(409);
        expect(messageForRpcError('erro em coupon_redemptions').status).toBe(409);
    });

    it('sessão ausente vira 401', () => {
        expect(messageForRpcError('AUTH_REQUIRED').status).toBe(401);
    });

    // Migração 0006 — sem estes dois mapeamentos, um carrinho sem variante
    // devolveria 500 genérico e o cliente não saberia que faltou escolher tamanho.
    it('variante obrigatória vira 400 dizendo o que fazer', () => {
        const r = messageForRpcError('VARIANT_REQUIRED:9f1c...');
        expect(r.status).toBe(400);
        expect(r.message).toMatch(/tamanho/i);
    });

    it('variante inexistente vira 400', () => {
        expect(messageForRpcError('VARIANT_NOT_FOUND:abc').status).toBe(400);
    });

    it('erro desconhecido vira 500 sem vazar detalhe interno do banco', () => {
        const r = messageForRpcError('relation "orders" does not exist at character 42');
        expect(r.status).toBe(500);
        expect(r.message).not.toMatch(/relation|character|orders/);
    });
});
