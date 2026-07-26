import { afterEach, describe, expect, it } from 'vitest';

import { getPaymentProvider } from './payment';

/**
 * O MockPaymentProvider devolve uma checkoutUrl que aponta para a própria loja
 * com status=success — ou seja, CONFIRMA o pedido sem cobrar nada. Se
 * PAYMENT_PROVIDER sumir num deploy de produção, é obrigatório falhar visivelmente
 * em vez de fechar venda fantasma.
 *
 * O discriminador é VERCEL_ENV, não NODE_ENV: em preview deployment da Vercel
 * NODE_ENV também vale 'production' (é build de produção do Next), e usar mock em
 * preview é legítimo.
 */
type MutableEnv = Record<string, string | undefined>;
const env = process.env as unknown as MutableEnv;

const original = {
    PAYMENT_PROVIDER: env.PAYMENT_PROVIDER,
    VERCEL_ENV: env.VERCEL_ENV,
    NODE_ENV: env.NODE_ENV,
};

function set(key: keyof typeof original, value: string | undefined) {
    if (value === undefined) delete env[key];
    else env[key] = value;
}

afterEach(() => {
    (Object.keys(original) as Array<keyof typeof original>).forEach((k) => set(k, original[k]));
});

describe('getPaymentProvider — fail-closed contra o mock', () => {
    it('LANÇA em produção real quando PAYMENT_PROVIDER está ausente', () => {
        set('VERCEL_ENV', 'production');
        set('PAYMENT_PROVIDER', undefined);
        expect(() => getPaymentProvider()).toThrow(/PAYMENT_PROVIDER/);
    });

    it('LANÇA em produção real quando PAYMENT_PROVIDER é explicitamente "mock"', () => {
        set('VERCEL_ENV', 'production');
        set('PAYMENT_PROVIDER', 'mock');
        expect(() => getPaymentProvider()).toThrow(/sem cobrar/);
    });

    it('NÃO lança em preview com mock — testar branch sem cobrança é legítimo', () => {
        set('VERCEL_ENV', 'preview');
        set('NODE_ENV', 'production'); // é assim que a Vercel builda preview
        set('PAYMENT_PROVIDER', 'mock');
        expect(() => getPaymentProvider()).not.toThrow();
    });

    it('NÃO lança em desenvolvimento', () => {
        set('VERCEL_ENV', undefined);
        set('NODE_ENV', 'development');
        set('PAYMENT_PROVIDER', undefined);
        expect(() => getPaymentProvider()).not.toThrow();
    });

    it('fora da Vercel, cai no NODE_ENV e continua fail-closed', () => {
        set('VERCEL_ENV', undefined);
        set('NODE_ENV', 'production');
        set('PAYMENT_PROVIDER', undefined);
        expect(() => getPaymentProvider()).toThrow(/PAYMENT_PROVIDER/);
    });

    it('a checagem é sobre o provider resolvido, não sobre a string crua', () => {
        set('VERCEL_ENV', 'production');
        set('PAYMENT_PROVIDER', '  MOCK  '.trim().toLowerCase());
        expect(() => getPaymentProvider()).toThrow();
    });
});
