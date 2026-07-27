import { describe, expect, it } from 'vitest';

import { parseStockEvent } from './stockEvent';

/**
 * Este parser interpreta payload vindo de FORA e o resultado grava estoque.
 * Um falso positivo aqui zera o saldo de um produto; um falso negativo faz a
 * loja ignorar uma reposição. Por isso os casos degenerados são explícitos.
 */
describe('parseStockEvent — formato Bling v3', () => {
    it('lê produto.id e saldoVirtualTotal aninhados em data', () => {
        expect(
            parseStockEvent({ data: { produto: { id: 123 }, saldoVirtualTotal: 7 } })
        ).toEqual({ blingId: 123, saldo: 7 });
    });

    it('aceita saldo zero (produto esgotado é informação válida)', () => {
        expect(
            parseStockEvent({ data: { produto: { id: 9 }, saldoVirtualTotal: 0 } })
        ).toEqual({ blingId: 9, saldo: 0 });
    });
});

describe('parseStockEvent — formato genérico', () => {
    it('lê blingId + saldo na raiz', () => {
        expect(parseStockEvent({ blingId: 55, saldo: 3 })).toEqual({ blingId: 55, saldo: 3 });
    });

    it('aceita idProduto e quantity como sinônimos', () => {
        expect(parseStockEvent({ idProduto: 55, quantity: 3 })).toEqual({ blingId: 55, saldo: 3 });
    });

    it('aceita números como string (JSON de integração costuma mandar assim)', () => {
        expect(parseStockEvent({ blingId: '55', saldo: '3' })).toEqual({ blingId: 55, saldo: 3 });
    });
});

describe('parseStockEvent — normalização do saldo', () => {
    it('nunca devolve saldo negativo', () => {
        expect(parseStockEvent({ blingId: 1, saldo: -5 })?.saldo).toBe(0);
    });

    it('trunca fracionário (não existe meia peça)', () => {
        expect(parseStockEvent({ blingId: 1, saldo: 4.9 })?.saldo).toBe(4);
    });
});

describe('parseStockEvent — payloads que NÃO podem virar UPDATE', () => {
    it('rejeita payload vazio, nulo e tipos errados', () => {
        for (const p of [null, undefined, {}, [], 'texto', 42]) {
            expect(parseStockEvent(p), `payload: ${JSON.stringify(p)}`).toBeNull();
        }
    });

    it('rejeita quando falta o id', () => {
        expect(parseStockEvent({ saldo: 10 })).toBeNull();
    });

    it('rejeita quando falta o saldo', () => {
        expect(parseStockEvent({ blingId: 10 })).toBeNull();
    });

    // Number(null) === 0 e Number('') === 0. Sem tratamento, qualquer um dos
    // dois zeraria o estoque do produto a partir de um payload quase vazio.
    it('rejeita saldo null (não confunde com zero)', () => {
        expect(parseStockEvent({ blingId: 10, saldo: null })).toBeNull();
    });

    it('rejeita saldo string vazia (não confunde com zero)', () => {
        expect(parseStockEvent({ blingId: 10, saldo: '   ' })).toBeNull();
    });

    it('rejeita saldo não-numérico', () => {
        expect(parseStockEvent({ blingId: 10, saldo: 'muitos' })).toBeNull();
    });

    it('rejeita id não inteiro ou não positivo', () => {
        expect(parseStockEvent({ blingId: 0, saldo: 1 })).toBeNull();
        expect(parseStockEvent({ blingId: -3, saldo: 1 })).toBeNull();
        expect(parseStockEvent({ blingId: 1.5, saldo: 1 })).toBeNull();
    });
});
