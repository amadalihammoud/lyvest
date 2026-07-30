import { describe, expect, it } from 'vitest';

import { buildBlingOrderPayload, onlyDigits, toBlingDate } from './orderPayload';

describe('onlyDigits', () => {
    it('remove máscara de CPF/CNPJ', () => {
        expect(onlyDigits('123.456.789-09')).toBe('12345678909');
        expect(onlyDigits('12.345.678/0001-90')).toBe('12345678000190');
    });
});

describe('toBlingDate', () => {
    it('formata ISO para YYYY-MM-DD', () => {
        expect(toBlingDate('2026-07-30T15:00:00.000Z')).toBe('2026-07-30');
    });
});

describe('buildBlingOrderPayload', () => {
    it('monta contato PF, itens e endereço de entrega', () => {
        const body = buildBlingOrderPayload({
            orderId: 'ord-1',
            createdAt: '2026-07-30T12:00:00.000Z',
            customerName: 'Maria Silva',
            customerDocument: '123.456.789-09',
            customerEmail: 'maria@x.com',
            paymentMethod: 'pix',
            items: [
                {
                    name: 'Sutiã',
                    quantity: 2,
                    price: 89.9,
                    sku: 'SUT-P',
                    blingProductId: 16682834177,
                },
            ],
            shipping: {
                price: 25.5,
                recipient: 'Maria Silva',
                street: 'Rua A',
                number: '100',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'sp',
                zipCode: '01310-100',
            },
            lojaId: 123,
        });

        expect(body.data).toBe('2026-07-30');
        expect(body.numeroLoja).toBe('ord-1');
        expect(body.contato).toMatchObject({
            nome: 'Maria Silva',
            tipoPessoa: 'F',
            numeroDocumento: '12345678909',
            email: 'maria@x.com',
        });
        expect(body.itens).toEqual([
            {
                descricao: 'Sutiã',
                quantidade: 2,
                valor: 89.9,
                unidade: 'UN',
                codigo: 'SUT-P',
                produto: { id: 16682834177 },
            },
        ]);
        expect(body.loja).toEqual({ id: 123 });
        expect(body.transporte).toMatchObject({
            frete: 25.5,
            fretePorConta: 1,
            contato: {
                nome: 'Maria Silva',
                endereco: {
                    endereco: 'Rua A',
                    numero: '100',
                    bairro: 'Centro',
                    municipio: 'São Paulo',
                    uf: 'SP',
                    cep: '01310100',
                },
            },
        });
    });

    it('sem documento válido não manda numeroDocumento', () => {
        const body = buildBlingOrderPayload({
            orderId: 'x',
            customerName: 'Guest',
            customerDocument: 'abc',
            items: [{ name: 'A', quantity: 1, price: 10 }],
        });
        expect((body.contato as Record<string, unknown>).numeroDocumento).toBeUndefined();
    });

    it('CNPJ marca pessoa jurídica', () => {
        const body = buildBlingOrderPayload({
            orderId: 'x',
            customerName: 'Empresa',
            customerDocument: '12345678000190',
            items: [{ name: 'A', quantity: 1, price: 10 }],
        });
        expect((body.contato as Record<string, unknown>).tipoPessoa).toBe('J');
    });
});
