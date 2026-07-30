import { describe, expect, it } from 'vitest';

import {
    buildPaymentCustomer,
    buildRateLimitMessage,
    buildSessionItems,
    needsGuestEmail,
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

    it('o nome do cartão tem precedência sobre o nome da conta', () => {
        const user = { fullName: 'João Conta', primaryEmailAddress: { emailAddress: 'joao@x.com' } };
        const c = buildPaymentCustomer('Maria Cartao', user);
        expect(c.firstName).toBe('Maria');
        expect(c.lastName).toBe('Cartao');
        expect(c.email).toBe('joao@x.com');
    });

    it('e-mail explícito (guest PIX) vence o da conta', () => {
        const user = { fullName: 'João', primaryEmailAddress: { emailAddress: 'joao@x.com' } };
        expect(buildPaymentCustomer('', user, 'pix@y.com').email).toBe('pix@y.com');
    });

    it('cai para o nome da conta quando o campo do cartão está vazio', () => {
        const user = { fullName: 'João Conta', primaryEmailAddress: { emailAddress: 'joao@x.com' } };
        expect(buildPaymentCustomer('', user).firstName).toBe('João');
    });

    it('usa "Cliente" quando não há nome em lugar nenhum', () => {
        expect(buildPaymentCustomer('', null).firstName).toBe('Cliente');
    });

    it('aceita nome único, com sobrenome vazio', () => {
        expect(buildPaymentCustomer('Madonna', null)).toEqual({
            firstName: 'Madonna',
            lastName: '',
            email: 'checkout@lyvest.com.br',
        });
    });
});

describe('needsGuestEmail', () => {
    it('pede e-mail quando não há user ou e-mail', () => {
        expect(needsGuestEmail(null)).toBe(true);
        expect(needsGuestEmail({})).toBe(true);
        expect(needsGuestEmail({ primaryEmailAddress: { emailAddress: '  ' } })).toBe(true);
    });

    it('não pede quando Clerk tem e-mail', () => {
        expect(needsGuestEmail({ primaryEmailAddress: { emailAddress: 'a@b.com' } })).toBe(false);
    });
});

describe('buildSessionItems', () => {
    it('envia só id, quantidade e variante', () => {
        expect(buildSessionItems([{ id: 'p1', qty: 2, variantId: 'v1' }])).toEqual([
            { id: 'p1', quantity: 2, variantId: 'v1' },
        ]);
    });

    it('descarta preço, nome e qualquer outro campo do carrinho', () => {
        const itens = buildSessionItems([{ id: 'p1', qty: 1, price: 0.01, name: 'hack' } as never]);
        expect(Object.keys(itens[0]).sort()).toEqual(['id', 'quantity', 'variantId']);
    });
});

describe('resolveSessionOutcome', () => {
    it('redireciona quando o gateway devolve checkoutUrl', () => {
        expect(resolveSessionOutcome({ checkoutUrl: 'https://pay.x/1', status: 'pending' })).toEqual({
            kind: 'redirect',
            url: 'https://pay.x/1',
        });
    });

    it('PIX on-site tem precedência sobre checkoutUrl vazio', () => {
        const o = resolveSessionOutcome({
            mode: 'pix_on_site',
            qrCode: 'img',
            pixCopyPaste: '000201',
            orderId: 'o1',
            checkoutUrl: '',
        });
        expect(o.kind).toBe('pix');
        if (o.kind === 'pix') {
            expect(o.orderId).toBe('o1');
            expect(o.pixCopyPaste).toBe('000201');
        }
    });

    it('checkoutUrl tem precedência sobre status success', () => {
        expect(resolveSessionOutcome({ checkoutUrl: 'https://pay.x/1', status: 'success' }).kind).toBe(
            'redirect'
        );
    });

    it('sucesso direto quando não há url mas o status é success', () => {
        expect(resolveSessionOutcome({ status: 'success' })).toEqual({ kind: 'direct-success' });
    });

    it('lança quando não há url nem sucesso', () => {
        expect(() => resolveSessionOutcome({ status: 'pending' })).toThrow(/URL de pagamento/);
        expect(() => resolveSessionOutcome(null)).toThrow(/URL de pagamento/);
    });
});

describe('buildRateLimitMessage', () => {
    it('usa a tradução quando existe', () => {
        expect(buildRateLimitMessage('Calma lá', 60000)).toBe('Calma lá');
    });

    it('arredonda para cima — nunca diz 0 minuto', () => {
        expect(buildRateLimitMessage(undefined, 30000)).toBe('Muitas tentativas. Aguarde 1 minuto(s).');
    });
});
