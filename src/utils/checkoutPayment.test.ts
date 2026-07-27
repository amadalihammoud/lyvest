import { describe, expect, it } from 'vitest';

import {
    buildPaymentCustomer,
    buildRateLimitMessage,
    buildSessionItems,
    resolveSessionOutcome,
} from './checkoutPayment';

describe('buildPaymentCustomer', () => {
    it('divide o nome do cartão em nome e sobrenome', () => {
        expect(buildPaymentCustomer('Maria Silva Souza', null)).toEqual({
            firstName: 'Maria',
            lastName: 'Silva Souza',
            email: 'checkout@lyvest.com.br',
        });
    });

    // Quem paga pode não ser o titular da conta, e o gateway confere o nome
    // contra o cartão — o que foi digitado ali vence.
    it('o nome do cartão tem precedência sobre o nome da conta', () => {
        const user = { fullName: 'João Conta', primaryEmailAddress: { emailAddress: 'joao@x.com' } };
        const c = buildPaymentCustomer('Maria Cartao', user);
        expect(c.firstName).toBe('Maria');
        expect(c.lastName).toBe('Cartao');
        expect(c.email).toBe('joao@x.com');
    });

    it('cai para o nome da conta quando o campo do cartão está vazio', () => {
        const user = { fullName: 'João Conta', primaryEmailAddress: { emailAddress: 'joao@x.com' } };
        expect(buildPaymentCustomer('', user).firstName).toBe('João');
    });

    it('usa "Cliente" quando não há nome em lugar nenhum', () => {
        expect(buildPaymentCustomer('', null).firstName).toBe('Cliente');
        expect(buildPaymentCustomer('', undefined).firstName).toBe('Cliente');
    });

    // Sobrenome vazio é aceitável para o gateway; inventar um seria pior.
    it('aceita nome único, com sobrenome vazio', () => {
        expect(buildPaymentCustomer('Madonna', null)).toEqual({
            firstName: 'Madonna',
            lastName: '',
            email: 'checkout@lyvest.com.br',
        });
    });

    it('não confunde "Cliente" (default do nome) com sobrenome', () => {
        expect(buildPaymentCustomer('', null).lastName).toBe('');
    });

    it('atravessa usuário sem e-mail ou com e-mail nulo', () => {
        expect(buildPaymentCustomer('A B', { fullName: null, primaryEmailAddress: null }).email)
            .toBe('checkout@lyvest.com.br');
        expect(buildPaymentCustomer('A B', { primaryEmailAddress: { emailAddress: null } }).email)
            .toBe('checkout@lyvest.com.br');
    });
});

describe('buildSessionItems', () => {
    it('envia só id, quantidade e variante', () => {
        expect(buildSessionItems([{ id: 'p1', qty: 2, variantId: 'v1' }])).toEqual([
            { id: 'p1', quantity: 2, variantId: 'v1' },
        ]);
    });

    // Preço vindo do cliente é ignorado pelo servidor; mandá-lo só criaria a
    // ilusão de que o cliente decide quanto paga.
    it('descarta preço, nome e qualquer outro campo do carrinho', () => {
        const itens = buildSessionItems([
            { id: 'p1', qty: 1, price: 0.01, name: 'hack' } as never,
        ]);
        expect(Object.keys(itens[0]).sort()).toEqual(['id', 'quantity', 'variantId']);
    });

    it('preserva variantId ausente como undefined, não como null', () => {
        expect(buildSessionItems([{ id: 'p1', qty: 1 }])[0].variantId).toBeUndefined();
    });

    it('carrinho vazio vira lista vazia', () => {
        expect(buildSessionItems([])).toEqual([]);
    });
});

describe('resolveSessionOutcome', () => {
    it('redireciona quando o gateway devolve checkoutUrl', () => {
        expect(resolveSessionOutcome({ checkoutUrl: 'https://pay.x/1', status: 'pending' }))
            .toEqual({ kind: 'redirect', url: 'https://pay.x/1' });
    });

    // checkoutUrl vence status: se há para onde mandar o cliente, manda.
    it('checkoutUrl tem precedência sobre status success', () => {
        expect(resolveSessionOutcome({ checkoutUrl: 'https://pay.x/1', status: 'success' }).kind)
            .toBe('redirect');
    });

    it('sucesso direto quando não há url mas o status é success', () => {
        expect(resolveSessionOutcome({ status: 'success' })).toEqual({ kind: 'direct-success' });
    });

    it('lança quando não há url nem sucesso — o caso que não pode passar calado', () => {
        expect(() => resolveSessionOutcome({ status: 'pending' })).toThrow(/URL de pagamento/);
        expect(() => resolveSessionOutcome(null)).toThrow(/URL de pagamento/);
        expect(() => resolveSessionOutcome(undefined)).toThrow(/URL de pagamento/);
        expect(() => resolveSessionOutcome({ checkoutUrl: '' })).toThrow(/URL de pagamento/);
    });
});

describe('buildRateLimitMessage', () => {
    it('usa a tradução quando existe', () => {
        expect(buildRateLimitMessage('Calma lá', 60000)).toBe('Calma lá');
    });

    // "Aguarde 0 minutos" faria o cliente tentar de novo e bater na mesma parede.
    it('arredonda para cima — nunca diz 0 minuto', () => {
        expect(buildRateLimitMessage(undefined, 30000)).toBe('Muitas tentativas. Aguarde 1 minuto(s).');
        expect(buildRateLimitMessage(undefined, 1)).toBe('Muitas tentativas. Aguarde 1 minuto(s).');
    });

    it('converte milissegundos em minutos', () => {
        expect(buildRateLimitMessage('', 300000)).toBe('Muitas tentativas. Aguarde 5 minuto(s).');
        expect(buildRateLimitMessage('', 61000)).toBe('Muitas tentativas. Aguarde 2 minuto(s).');
    });
});
