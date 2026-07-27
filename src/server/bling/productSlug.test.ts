import { describe, expect, it } from 'vitest';

import { decideProductWrite } from './productSlug';

/**
 * O caso que motiva estes testes é real e já aconteceu com CATEGORIAS neste
 * projeto: "Cueca" existe em Masculino E em Menino no Bling da loja. Com
 * produtos, o efeito seria pior — um produto sumiria do catálogo e o outro
 * herdaria preço, estoque e imagem errados, trocando de identidade a cada sync.
 */
describe('decideProductWrite', () => {
    it('atualiza in-place quando já conhece o bling_id', () => {
        expect(
            decideProductWrite({
                baseSlug: 'cueca-boxer',
                matchedByBlingId: 'uuid-local',
                blingId: 123,
            })
        ).toEqual({ mode: 'update', slug: 'cueca-boxer' });
    });

    it('a correlação por bling_id tem precedência sobre a colisão de slug', () => {
        // Se o produto já é conhecido, nada de renomear slug: é o mesmo item.
        const d = decideProductWrite({
            baseSlug: 'cueca-boxer',
            matchedByBlingId: 'uuid-local',
            matchedBySlug: { id: 'outro', blingId: 999 },
            blingId: 123,
        });
        expect(d).toEqual({ mode: 'update', slug: 'cueca-boxer' });
    });

    it('insere com slug limpo quando não há colisão', () => {
        expect(
            decideProductWrite({ baseSlug: 'sutia-renda', blingId: 77 })
        ).toEqual({ mode: 'insert', slug: 'sutia-renda' });
    });

    // Produto cadastrado à mão antes da integração existir: é o mesmo item,
    // então adotar e vincular ao ERP é o comportamento correto.
    it('ADOTA linha do seed (bling_id nulo) com o mesmo slug', () => {
        expect(
            decideProductWrite({
                baseSlug: 'sutia-renda',
                matchedBySlug: { id: 'uuid-seed', blingId: null },
                blingId: 77,
            })
        ).toEqual({ mode: 'adopt', slug: 'sutia-renda' });
    });

    // O CASO QUE ERA BUG: adotar aqui sobrescreveria o bling_id do outro
    // produto, fundindo dois itens distintos numa linha só.
    it('NÃO adota linha que já pertence a outro produto do Bling', () => {
        const d = decideProductWrite({
            baseSlug: 'cueca-boxer',
            matchedBySlug: { id: 'uuid-do-masculino', blingId: 111 },
            codigo: 'CB-MENINO-01',
            blingId: 222,
        });
        expect(d.mode).toBe('insert');
        expect(d.slug).not.toBe('cueca-boxer');
    });

    it('desambigua preferindo o código/SKU, que é legível na URL', () => {
        expect(
            decideProductWrite({
                baseSlug: 'cueca-boxer',
                matchedBySlug: { id: 'x', blingId: 111 },
                codigo: 'CB-MENINO-01',
                blingId: 222,
            }).slug
        ).toBe('cueca-boxer-cb-menino-01');
    });

    it('normaliza código com espaço, acento e barra', () => {
        expect(
            decideProductWrite({
                baseSlug: 'cueca',
                matchedBySlug: { id: 'x', blingId: 111 },
                codigo: 'CB Menino/Ação 01',
                blingId: 222,
            }).slug
        ).toBe('cueca-cb-menino-acao-01');
    });

    it('cai para o bling_id quando não há código', () => {
        for (const codigo of [undefined, null, '', '   ']) {
            expect(
                decideProductWrite({
                    baseSlug: 'cueca',
                    matchedBySlug: { id: 'x', blingId: 111 },
                    codigo,
                    blingId: 222,
                }).slug,
                `codigo: ${JSON.stringify(codigo)}`
            ).toBe('cueca-222');
        }
    });

    // Determinismo importa: slug que muda a cada sync quebra links já indexados
    // pelo Google e compartilhados por clientes.
    it('é DETERMINÍSTICO — o mesmo produto gera sempre o mesmo slug', () => {
        const entrada = {
            baseSlug: 'cueca',
            matchedBySlug: { id: 'x', blingId: 111 },
            codigo: 'CB-01',
            blingId: 222,
        };
        expect(decideProductWrite(entrada).slug).toBe(decideProductWrite(entrada).slug);
    });
});
