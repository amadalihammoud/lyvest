import { describe, expect, it } from 'vitest';

import {
    buildProductValues,
    mapBlingProductFields,
    pickStockWriteValues,
    resolveLocalCategoryId,
    toSlugMatch,
} from './productValues';

const produtoReal = (over = {}) => ({
    nome: 'TESTE - Sutiã Renda Comfort',
    preco: 149.9,
    situacao: 'A',
    estoque: { saldoVirtualTotal: 16 },
    ...over,
});

describe('mapBlingProductFields', () => {
    it('traduz o produto real desta loja', () => {
        expect(mapBlingProductFields(produtoReal())).toEqual({
            nome: 'TESTE - Sutiã Renda Comfort',
            image: null,
            stock: 16,
            price: '149.9',
            promo: null,
            descricao: undefined,
            active: true,
        });
    });

    it('descarta produto sem nome utilizável', () => {
        expect(mapBlingProductFields(produtoReal({ nome: '   ' }))).toBeNull();
        expect(mapBlingProductFields(produtoReal({ nome: '' }))).toBeNull();
    });

    it('apara espaços do nome', () => {
        expect(mapBlingProductFields(produtoReal({ nome: '  Calcinha  ' }))!.nome).toBe('Calcinha');
    });

    // O Bling usa nomes diferentes para o campo conforme o endpoint.
    it('aceita a imagem por imagemURL ou urlImagem', () => {
        expect(mapBlingProductFields(produtoReal({ imagemURL: 'a.jpg' }))!.image).toBe('a.jpg');
        expect(mapBlingProductFields(produtoReal({ urlImagem: 'b.jpg' }))!.image).toBe('b.jpg');
        expect(mapBlingProductFields(produtoReal({ imagemURL: 'a.jpg', urlImagem: 'b.jpg' }))!.image).toBe('a.jpg');
        expect(mapBlingProductFields(produtoReal({ imagemURL: '' }))!.image).toBeNull();
    });

    it('nunca produz estoque negativo ou fracionário', () => {
        expect(mapBlingProductFields(produtoReal({ estoque: { saldoVirtualTotal: -5 } }))!.stock).toBe(0);
        expect(mapBlingProductFields(produtoReal({ estoque: { saldoVirtualTotal: 4.9 } }))!.stock).toBe(4);
        expect(mapBlingProductFields(produtoReal({ estoque: undefined }))!.stock).toBe(0);
    });

    // Promoção "0.00" tratada como válida cobraria R$ 0 pelo produto.
    it('só aceita promoção maior que zero', () => {
        expect(mapBlingProductFields(produtoReal({ precoPromocional: 99.9 }))!.promo).toBe('99.9');
        expect(mapBlingProductFields(produtoReal({ precoPromocional: 0 }))!.promo).toBeNull();
        expect(mapBlingProductFields(produtoReal({ precoPromocional: null }))!.promo).toBeNull();
        expect(mapBlingProductFields(produtoReal({ precoPromocional: -10 }))!.promo).toBeNull();
    });

    it('produto sem preço vira "0", não NaN', () => {
        expect(mapBlingProductFields(produtoReal({ preco: undefined }))!.price).toBe('0');
    });

    /**
     * O Bling manda `descricaoCurta: ''` quando o produto não tem descrição
     * curta cadastrada. Com `?? undefined` a string vazia passava, e o Drizzle
     * gravava '' por cima da descrição escrita à mão no admin — a cada sync.
     * Só `undefined` é omitido do UPDATE, e omitir é o que preserva o local.
     */
    describe('descrição', () => {
        it('string vazia ou só espaços NÃO apaga a descrição local', () => {
            expect(mapBlingProductFields(produtoReal({ descricaoCurta: '' }))!.descricao).toBeUndefined();
            expect(mapBlingProductFields(produtoReal({ descricaoCurta: '   ' }))!.descricao).toBeUndefined();
            expect(mapBlingProductFields(produtoReal({ descricaoCurta: undefined }))!.descricao).toBeUndefined();
        });

        it('descrição de verdade passa, sem espaços nas pontas', () => {
            expect(mapBlingProductFields(produtoReal({ descricaoCurta: '  Renda macia  ' }))!.descricao)
                .toBe('Renda macia');
        });

        // buildProductValues precisa OMITIR a chave, não mandá-la undefined:
        // é a ausência que faz o Drizzle deixar a coluna em paz.
        it('omitida do payload quando não há descrição', () => {
            const v = buildProductValues(mapBlingProductFields(produtoReal({ descricaoCurta: '' }))!, null);
            expect(v.description).toBeUndefined();
        });
    });

    it('situacao "I" marca inativo; qualquer outra coisa é ativo', () => {
        expect(mapBlingProductFields(produtoReal({ situacao: 'I' }))!.active).toBe(false);
        expect(mapBlingProductFields(produtoReal({ situacao: 'A' }))!.active).toBe(true);
        expect(mapBlingProductFields(produtoReal({ situacao: undefined }))!.active).toBe(true);
    });
});

describe('resolveLocalCategoryId', () => {
    const mapa = new Map([[123, 'uuid-cat']]);

    it('mapeia a categoria do Bling para o id local', () => {
        expect(resolveLocalCategoryId(mapa, { id: 123 })).toBe('uuid-cat');
    });

    it('devolve null quando não há categoria ou ela não foi sincronizada', () => {
        expect(resolveLocalCategoryId(mapa, undefined)).toBeNull();
        expect(resolveLocalCategoryId(mapa, { id: 999 })).toBeNull();
        expect(resolveLocalCategoryId(mapa, { id: 0 })).toBeNull();
    });
});

describe('buildProductValues', () => {
    const fields = mapBlingProductFields(produtoReal())!;

    it('monta o payload comum a insert e update', () => {
        expect(buildProductValues(fields, null)).toEqual({
            name: 'TESTE - Sutiã Renda Comfort',
            description: undefined,
            price: '149.9',
            promotionalPrice: null,
            active: true,
        });
    });

    // Passar null apagaria a imagem local sempre que o Bling não trouxesse uma.
    // Ausente do objeto, o Drizzle não inclui a coluna no UPDATE.
    it('omite imageUrl e categoryId quando não há valor — não grava null', () => {
        const v = buildProductValues(fields, null);
        expect('imageUrl' in v).toBe(false);
        expect('categoryId' in v).toBe(false);
    });

    it('inclui imageUrl e categoryId quando há valor', () => {
        const comImagem = mapBlingProductFields(produtoReal({ imagemURL: 'x.jpg' }))!;
        const v = buildProductValues(comImagem, 'uuid-cat');
        expect(v.imageUrl).toBe('x.jpg');
        expect(v.categoryId).toBe('uuid-cat');
    });
});

describe('toSlugMatch', () => {
    it('converte a linha achada por slug', () => {
        expect(toSlugMatch({ id: 'p1', blingId: 42 })).toEqual({ id: 'p1', blingId: 42 });
    });

    // Produto local sem bling_id (criado à mão) precisa ser distinguível de
    // "nenhuma linha achada" — é o que decideProductWrite usa para não fundir
    // dois produtos homônimos num só.
    it('preserva blingId nulo como null, não como undefined', () => {
        expect(toSlugMatch({ id: 'p1', blingId: null })).toEqual({ id: 'p1', blingId: null });
    });

    it('sem linha, devolve null', () => {
        expect(toSlugMatch(undefined)).toBeNull();
    });
});

/**
 * Os dois eixos que decidem estoque são independentes e fáceis de trocar.
 * Errar cada um custa dinheiro em direção oposta: no update, overselling; no
 * insert, produto entrando na vitrine com estoque errado.
 */
describe('pickStockWriteValues', () => {
    const values = { name: 'X', price: '10' };

    it('UPDATE só leva stock quando o ERP é autoritativo', () => {
        expect(pickStockWriteValues({ values, stock: 7, stockIsAuthoritative: true, hasGrade: false }).updateValues)
            .toEqual({ ...values, stock: 7 });
        expect(pickStockWriteValues({ values, stock: 7, stockIsAuthoritative: false, hasGrade: false }).updateValues)
            .toEqual(values);
    });

    // Ter grade não muda o UPDATE: quem manda ali é só a flag.
    it('a grade NÃO influencia o UPDATE', () => {
        const comGrade = pickStockWriteValues({ values, stock: 7, stockIsAuthoritative: true, hasGrade: true });
        expect(comGrade.updateValues).toEqual({ ...values, stock: 7 });
    });

    it('INSERT leva stock só quando NÃO há grade', () => {
        expect(pickStockWriteValues({ values, stock: 7, stockIsAuthoritative: false, hasGrade: false }).insertValues)
            .toEqual({ ...values, stock: 7 });
        expect(pickStockWriteValues({ values, stock: 7, stockIsAuthoritative: false, hasGrade: true }).insertValues)
            .toEqual(values);
    });

    // A flag não muda o INSERT: produto novo não tem venda local a preservar.
    it('a flag do ERP NÃO influencia o INSERT', () => {
        const autoritativo = pickStockWriteValues({ values, stock: 7, stockIsAuthoritative: true, hasGrade: true });
        expect(autoritativo.insertValues).toEqual(values);
    });

    it('não muta o objeto recebido', () => {
        const original = { name: 'X', price: '10' };
        pickStockWriteValues({ values: original, stock: 7, stockIsAuthoritative: true, hasGrade: false });
        expect(original).toEqual({ name: 'X', price: '10' });
    });
});
