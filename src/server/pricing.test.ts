import { describe, expect, it } from 'vitest';

import {
    buildVerifiedItems,
    computeSubtotal,
    computeTotal,
    effectiveUnitPrice,
    resolveDiscount,
    resolveDisplayPrice,
    type DbProductPrice,
} from './pricing';

const prod = (over: Partial<DbProductPrice> = {}): DbProductPrice => ({
    id: 'uuid-1',
    name: 'Sutiã Renda',
    price: '149.90',
    promotionalPrice: null,
    ...over,
});

/**
 * Estas funções decidem o que o cliente vê e o que é enviado ao gateway.
 * A autoridade final continua sendo a função SQL create_order, mas divergência
 * entre vitrine e cobrança é reclamação de cliente — e problema de CDC.
 */
describe('effectiveUnitPrice', () => {
    it('usa o preço cheio quando não há promoção', () => {
        expect(effectiveUnitPrice('149.90', null)).toBe(149.9);
    });

    it('usa a promoção quando ela é válida', () => {
        expect(effectiveUnitPrice('149.90', '99.90')).toBe(99.9);
    });

    // `promotional_price ?? price` só desvia em null. Uma promoção "0.00" vinda
    // do ERP seria adotada e o item sairia de graça.
    it('IGNORA promoção zerada — o item nunca sai de graça', () => {
        expect(effectiveUnitPrice('149.90', '0')).toBe(149.9);
        expect(effectiveUnitPrice('149.90', '0.00')).toBe(149.9);
    });

    it('IGNORA promoção negativa ou não numérica', () => {
        expect(effectiveUnitPrice('149.90', '-1')).toBe(149.9);
        expect(effectiveUnitPrice('149.90', 'grátis')).toBe(149.9);
        expect(effectiveUnitPrice('149.90', '')).toBe(149.9);
    });

    it('aceita promoção MAIOR que o preço cheio (decisão do lojista, não erro)', () => {
        expect(effectiveUnitPrice('100.00', '120.00')).toBe(120);
    });
});

describe('resolveDisplayPrice', () => {
    it('risca o cheio só quando a promoção é realmente menor', () => {
        expect(resolveDisplayPrice('149.90', '99.90')).toEqual({ price: 99.9, oldPrice: 149.9 });
        expect(resolveDisplayPrice('100.00', '120.00')).toEqual({ price: 120 });
        expect(resolveDisplayPrice('149.90', null)).toEqual({ price: 149.9 });
    });
});

describe('buildVerifiedItems — Zero-Trust', () => {
    it('pega nome e preço do BANCO, ignorando o que veio do cliente', () => {
        const itens = buildVerifiedItems(
            // O cliente pode mandar o que quiser além de id/quantidade: é descartado.
            [{ id: 'uuid-1', quantity: 2, price: 0.01, name: 'Hackeado' } as never],
            [prod()]
        );
        expect(itens).toEqual([
            { id: 'uuid-1', name: 'Sutiã Renda', price: 149.9, quantity: 2 },
        ]);
    });

    it('aplica a promoção do banco', () => {
        const itens = buildVerifiedItems(
            [{ id: 'uuid-1', quantity: 1 }],
            [prod({ promotionalPrice: '99.90' })]
        );
        expect(itens[0].price).toBe(99.9);
    });

    it('casa ids numéricos com uuid em string sem se perder', () => {
        const itens = buildVerifiedItems([{ id: 7, quantity: 1 }], [prod({ id: '7' })]);
        expect(itens[0].id).toBe('7');
    });

    // Seguir com o item faltando cobraria MENOS do que o carrinho mostrava.
    it('LANÇA quando um item do carrinho não existe no banco', () => {
        expect(() => buildVerifiedItems([{ id: 'fantasma', quantity: 1 }], [prod()])).toThrow(
            /fantasma/
        );
    });
});

describe('computeSubtotal', () => {
    it('multiplica preço por quantidade e soma', () => {
        expect(
            computeSubtotal([
                { id: 'a', name: 'A', price: 50, quantity: 3 },
                { id: 'b', name: 'B', price: 19.9, quantity: 2 },
            ])
        ).toBe(189.8);
    });

    it('arredonda para centavos (0.1 + 0.2 não pode virar 0.30000000000000004)', () => {
        expect(computeSubtotal([{ id: 'a', name: 'A', price: 0.1, quantity: 3 }])).toBe(0.3);
    });

    it('carrinho vazio é zero, não NaN', () => {
        expect(computeSubtotal([])).toBe(0);
    });
});

describe('resolveDiscount', () => {
    it('sem cupom, não há desconto', () => {
        expect(resolveDiscount(undefined, 200)).toEqual({ discountAmount: 0, appliedCoupon: null });
    });

    it('cupom inexistente não gera desconto', () => {
        expect(resolveDiscount('NAOEXISTE', 200)).toEqual({
            discountAmount: 0,
            appliedCoupon: null,
        });
    });

    it('aplica o percentual sobre o subtotal real e normaliza o código', () => {
        expect(resolveDiscount('  promo5 ', 200)).toEqual({
            discountAmount: 10,
            appliedCoupon: 'PROMO5',
        });
    });

    // O mínimo é revalidado contra o subtotal do SERVIDOR, não contra um valor
    // que o cliente tenha alegado.
    it('respeita o pedido mínimo do cupom', () => {
        expect(resolveDiscount('LYVEST2026', 30).discountAmount).toBe(0);
        expect(resolveDiscount('LYVEST2026', 100).discountAmount).toBe(15);
    });
});

describe('computeTotal', () => {
    it('subtrai o desconto do subtotal', () => {
        expect(computeTotal(200, 10)).toBe(190);
    });

    it('NUNCA devolve negativo, mesmo com desconto maior que o subtotal', () => {
        expect(computeTotal(50, 80)).toBe(0);
    });

    it('mantém centavos exatos', () => {
        expect(computeTotal(179.8, 17.98)).toBe(161.82);
    });
});
