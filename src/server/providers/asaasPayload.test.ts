import { describe, expect, it } from 'vitest';

import {
    buildAsaasPaymentLinkBody,
    buildOrderSummary,
    formatGatewayErrors,
    isCallbackRejection,
    resolveChargeValue,
    type AsaasItem,
} from './asaasPayload';

const item = (over: Partial<AsaasItem> = {}): AsaasItem => ({
    id: 'p1',
    name: 'Sutiã Renda',
    price: 89.9,
    quantity: 1,
    ...over,
});

/**
 * `value` é literalmente o quanto o cliente paga. É o campo mais importante do
 * projeto inteiro — e o Zero-Trust depende de ele vir do total do SERVIDOR, não
 * da soma dos itens que o cliente enviou.
 */
describe('resolveChargeValue', () => {
    it('PREFERE o amount autoritativo do servidor sobre a soma dos itens', () => {
        // Cenário real: subtotal 179,80 com cupom de 10% => servidor manda 161,82.
        const items = [item({ quantity: 2 })];
        expect(resolveChargeValue(items, 161.82)).toBe(161.82);
    });

    it('usa o amount do servidor mesmo quando ele NÃO bate com os itens', () => {
        // Se um dia a soma divergir, quem manda é o servidor — nunca os itens.
        expect(resolveChargeValue([item({ price: 1000, quantity: 5 })], 10)).toBe(10);
    });

    it('cai para a soma dos itens quando o servidor não informa total', () => {
        expect(resolveChargeValue([item({ price: 50, quantity: 3 })])).toBe(150);
    });

    it('arredonda para centavos (não manda 89.99000000000001 ao gateway)', () => {
        expect(resolveChargeValue([item({ price: 0.1, quantity: 3 })])).toBe(0.3);
        expect(resolveChargeValue([], 89.999)).toBe(90);
    });

    it('aceita zero explícito do servidor sem cair no fallback', () => {
        // `typeof amount === 'number'` é o teste certo aqui: com `amount || soma`,
        // um total zerado (cupom de 100%) viraria silenciosamente a soma dos itens.
        expect(resolveChargeValue([item({ price: 99, quantity: 1 })], 0)).toBe(0);
    });
});

describe('buildOrderSummary', () => {
    it('lista quantidade e nome', () => {
        expect(buildOrderSummary([item({ quantity: 2, name: 'Calcinha' })])).toBe('2x Calcinha');
    });

    it('cai para o id quando o item não tem nome', () => {
        expect(buildOrderSummary([item({ name: undefined, id: 'abc' })])).toBe('1x abc');
    });

    it('limita a 5 itens', () => {
        const muitos = Array.from({ length: 9 }, (_, i) => item({ name: `P${i}` }));
        expect(buildOrderSummary(muitos).split(', ')).toHaveLength(5);
    });

    it('respeita o limite de 255 caracteres do Asaas', () => {
        const longo = item({ name: 'N'.repeat(300) });
        expect(buildOrderSummary([longo, longo, longo]).length).toBeLessThanOrEqual(255);
    });
});

describe('buildAsaasPaymentLinkBody', () => {
    it('propaga o orderId como externalReference — é por ele que o webhook acha o pedido', () => {
        const body = buildAsaasPaymentLinkBody({ items: [item()], orderId: 'abc-123' });
        expect(body.externalReference).toBe('abc-123');
    });

    it('usa o orderId no nome da cobrança, em maiúsculas e truncado em 8', () => {
        const body = buildAsaasPaymentLinkBody({ items: [item()], orderId: 'abcdef12-9999' });
        expect(body.name).toBe('Pedido LyVest ABCDEF12');
    });

    it('mantém a política da loja: até 6x, sem notificação do gateway', () => {
        const body = buildAsaasPaymentLinkBody({ items: [item()] });
        expect(body.maxInstallmentCount).toBe(6);
        expect(body.notificationEnabled).toBe(false);
        expect(body.billingType).toBe('UNDEFINED'); // pagador escolhe Pix/cartão/boleto
    });

    // O Asaas rejeita callback http/localhost com 400. Se ele entrasse mesmo
    // assim, a cobrança inteira falharia por causa de um redirect acessório.
    it('inclui callback quando a origem é https', () => {
        const body = buildAsaasPaymentLinkBody({
            items: [item()],
            orderId: 'o1',
            appUrl: 'https://lyvest.com.br',
        });
        expect(body.callback?.successUrl).toBe(
            'https://lyvest.com.br/checkout?status=success&order=o1'
        );
        expect(body.callback?.autoRedirect).toBe(true);
    });

    it('OMITE callback em http e em localhost', () => {
        for (const appUrl of ['http://localhost:3000', 'http://lyvest.com.br', undefined, '']) {
            const body = buildAsaasPaymentLinkBody({ items: [item()], appUrl });
            expect(body.callback, `appUrl: ${appUrl}`).toBeUndefined();
        }
    });

    it('monta successUrl sem &order quando não há pedido', () => {
        const body = buildAsaasPaymentLinkBody({ items: [item()], appUrl: 'https://x.com.br' });
        expect(body.callback?.successUrl).toBe('https://x.com.br/checkout?status=success');
    });

    it('não manda description vazia quando não há itens', () => {
        const body = buildAsaasPaymentLinkBody({ items: [], amount: 10 });
        expect(body.description).toBeUndefined();
    });
});

/**
 * Decide se vale recriar a cobrança sem o redirect de retorno. Um falso
 * negativo aqui PERDE a venda: o link nunca é criado e o cliente vê erro.
 */
describe('isCallbackRejection', () => {
    it('reconhece a rejeição por domínio não cadastrado (com e sem acento)', () => {
        expect(isCallbackRejection([{ description: 'Informe um domínio válido' }])).toBe(true);
        expect(isCallbackRejection([{ description: 'dominio nao cadastrado' }])).toBe(true);
    });

    it('reconhece menção explícita a callback, em qualquer caixa', () => {
        expect(isCallbackRejection([{ description: 'O CALLBACK é inválido' }])).toBe(true);
    });

    it('não confunde com outros erros do gateway', () => {
        expect(isCallbackRejection([{ description: 'Valor mínimo não atingido' }])).toBe(false);
        expect(isCallbackRejection([{ code: 'invalid_value' }])).toBe(false);
    });

    it('tolera lista ausente, vazia e itens sem description', () => {
        expect(isCallbackRejection(undefined)).toBe(false);
        expect(isCallbackRejection(null)).toBe(false);
        expect(isCallbackRejection([])).toBe(false);
        expect(isCallbackRejection([{}])).toBe(false);
    });
});

describe('formatGatewayErrors', () => {
    it('junta código e descrição de cada erro', () => {
        expect(
            formatGatewayErrors([
                { code: 'invalid_value', description: 'Valor inválido' },
                { code: 'invalid_name', description: 'Nome inválido' },
            ])
        ).toBe('invalid_value: Valor inválido; invalid_name: Nome inválido');
    });

    it('usa "?" quando falta o código, sem quebrar', () => {
        expect(formatGatewayErrors([{ description: 'Sem código' }])).toBe('?: Sem código');
    });

    it('devolve string vazia para lista ausente ou vazia', () => {
        expect(formatGatewayErrors(undefined)).toBe('');
        expect(formatGatewayErrors([])).toBe('');
    });

    it('limita o tamanho para não estourar a linha de log', () => {
        const muitos = Array.from({ length: 50 }, () => ({
            code: 'err',
            description: 'D'.repeat(50),
        }));
        expect(formatGatewayErrors(muitos).length).toBeLessThanOrEqual(300);
    });
});
