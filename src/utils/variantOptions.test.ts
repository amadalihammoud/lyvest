import { describe, expect, it } from 'vitest';

import {
    buildSizeOptions,
    findSizeOption,
    isFullyOutOfStock,
    requiresSizeSelection,
    resolveVariantId,
} from './variantOptions';

/** A grade real desta loja, como o sync a gravou (P=5, M=8, G=3, GG=0). */
const gradeReal = {
    variants: [
        { id: 'v-p', size: 'P', stock: 5, price: 149.9 },
        { id: 'v-m', size: 'M', stock: 8, price: 149.9 },
        { id: 'v-g', size: 'G', stock: 3, price: 149.9 },
        { id: 'v-gg', size: 'GG', stock: 0, price: 149.9 },
    ],
};

describe('buildSizeOptions', () => {
    it('usa as variantes quando existem, com o id que o checkout exige', () => {
        expect(buildSizeOptions(gradeReal)).toEqual([
            { size: 'P', variantId: 'v-p', available: true },
            { size: 'M', variantId: 'v-m', available: true },
            { size: 'G', variantId: 'v-g', available: true },
            { size: 'GG', variantId: 'v-gg', available: false },
        ]);
    });

    // Esconder o esgotado faria a loja parecer nunca ter tido o tamanho.
    it('mantém o tamanho esgotado na lista, apenas indisponível', () => {
        const gg = buildSizeOptions(gradeReal).find((o) => o.size === 'GG');
        expect(gg).toBeDefined();
        expect(gg!.available).toBe(false);
    });

    it('cai para products.sizes quando não há grade, sem inventar variantId', () => {
        expect(buildSizeOptions({ sizes: ['P', 'M'] })).toEqual([
            { size: 'P', variantId: null, available: true },
            { size: 'M', variantId: null, available: true },
        ]);
    });

    // products.sizes é texto livre do ERP e pode divergir das variantes reais;
    // quem manda é a variante, senão o cliente escolhe um tamanho inexistente.
    it('ignora products.sizes quando há variantes', () => {
        const opts = buildSizeOptions({ ...gradeReal, sizes: ['XG', 'XXG'] });
        expect(opts.map((o) => o.size)).toEqual(['P', 'M', 'G', 'GG']);
    });

    it('descarta variante sem tamanho utilizável', () => {
        const opts = buildSizeOptions({
            variants: [
                { id: 'a', size: null, stock: 4, price: 10 },
                { id: 'b', size: '', stock: 4, price: 10 },
                { id: 'c', size: 'U', stock: 4, price: 10 },
            ],
        });
        expect(opts).toEqual([{ size: 'U', variantId: 'c', available: true }]);
    });

    it('produto sem tamanho nenhum devolve lista vazia, não erro', () => {
        expect(buildSizeOptions({})).toEqual([]);
        expect(buildSizeOptions({ sizes: [], variants: [] })).toEqual([]);
    });
});

describe('requiresSizeSelection', () => {
    it('exige escolha quando há tamanhos', () => {
        expect(requiresSizeSelection(buildSizeOptions(gradeReal))).toBe(true);
    });

    it('não exige nada de produto sem tamanho', () => {
        expect(requiresSizeSelection(buildSizeOptions({}))).toBe(false);
    });
});

describe('isFullyOutOfStock', () => {
    it('é falso enquanto houver um tamanho com saldo', () => {
        expect(isFullyOutOfStock(buildSizeOptions(gradeReal))).toBe(false);
    });

    it('é verdadeiro quando a grade inteira zerou', () => {
        const opts = buildSizeOptions({
            variants: [
                { id: 'a', size: 'P', stock: 0, price: 10 },
                { id: 'b', size: 'M', stock: 0, price: 10 },
            ],
        });
        expect(isFullyOutOfStock(opts)).toBe(true);
    });

    // Sem tamanho, quem manda no esgotado é products.stock — não este helper.
    it('produto sem tamanho nunca é "grade esgotada"', () => {
        expect(isFullyOutOfStock([])).toBe(false);
    });
});

describe('resolveVariantId', () => {
    it('devolve o id da variante do tamanho escolhido', () => {
        expect(resolveVariantId(buildSizeOptions(gradeReal), 'M')).toBe('v-m');
    });

    // undefined some do JSON; null explícito reprovaria no Zod do checkout.
    it('devolve undefined — nunca null — para tamanho legado', () => {
        const opts = buildSizeOptions({ sizes: ['P'] });
        expect(resolveVariantId(opts, 'P')).toBeUndefined();
    });

    it('devolve undefined quando nada foi escolhido ou o tamanho não existe', () => {
        const opts = buildSizeOptions(gradeReal);
        expect(resolveVariantId(opts, null)).toBeUndefined();
        expect(resolveVariantId(opts, 'XG')).toBeUndefined();
    });
});

describe('findSizeOption', () => {
    it('localiza pelo rótulo exato', () => {
        expect(findSizeOption(buildSizeOptions(gradeReal), 'GG')?.available).toBe(false);
    });

    it('não confunde ausência de escolha com tamanho', () => {
        expect(findSizeOption(buildSizeOptions(gradeReal), null)).toBeUndefined();
    });
});
