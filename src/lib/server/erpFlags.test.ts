import { afterEach, describe, expect, it } from 'vitest';

import { isErpStockAuthoritative } from './erpFlags';

/**
 * Enquanto o pedido pago não for sincronizado com o Bling, o saldo de lá ignora
 * as vendas do site. Se esta flag ligar por acidente, cada sync reinfla o estoque
 * e a loja vende o que não tem. O default TEM que ser desligado.
 */
const original = process.env.ERP_STOCK_AUTHORITATIVE;

function set(v: string | undefined) {
    if (v === undefined) delete process.env.ERP_STOCK_AUTHORITATIVE;
    else process.env.ERP_STOCK_AUTHORITATIVE = v;
}

afterEach(() => set(original));

describe('isErpStockAuthoritative', () => {
    it('DESLIGADO quando a variável não existe (default seguro)', () => {
        set(undefined);
        expect(isErpStockAuthoritative()).toBe(false);
    });

    it('ligado com "1" e com "true"', () => {
        set('1');
        expect(isErpStockAuthoritative()).toBe(true);
        set('true');
        expect(isErpStockAuthoritative()).toBe(true);
    });

    it('tolera caixa e espaços', () => {
        set('  TRUE  ');
        expect(isErpStockAuthoritative()).toBe(true);
    });

    it('DESLIGADO para qualquer outro valor — inclusive os que "parecem" ligados', () => {
        for (const v of ['0', 'false', '', 'sim', 'yes', 'on', 'enabled', 'undefined']) {
            set(v);
            expect(isErpStockAuthoritative(), `valor: "${v}"`).toBe(false);
        }
    });
});
