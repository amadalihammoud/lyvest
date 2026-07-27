import { describe, expect, it } from 'vitest';

import {
    collectVariationIds,
    parseVariationValue,
    temVariacoes,
    toVariantDrafts,
    type BlingVariacao,
} from './variations';

/**
 * Os dados destes testes são o payload REAL da API do Bling desta loja,
 * capturado em 27/07/2026 pelo modo ?inspect=1 do sync — não um formato
 * suposto a partir da documentação.
 */
const variacaoReal = (over: Partial<BlingVariacao> = {}): BlingVariacao => ({
    id: 16682834177,
    nome: 'TESTE - Sutiã Renda Comfort Tamanho:P',
    codigo: '',
    preco: 149.9,
    situacao: 'A',
    estoque: { saldoVirtualTotal: 5 },
    variacao: { nome: 'Tamanho:P', ordem: 1, produtoPai: { id: 16682830009 } },
    ...over,
});

describe('temVariacoes', () => {
    it('reconhece o pai pelo formato "V"', () => {
        expect(temVariacoes('V')).toBe(true);
    });

    it('não confunde simples/filho ("S") nem composição ("E")', () => {
        expect(temVariacoes('S')).toBe(false);
        expect(temVariacoes('E')).toBe(false);
        expect(temVariacoes(undefined)).toBe(false);
    });
});

describe('parseVariationValue', () => {
    it('extrai o valor de "Atributo:Valor"', () => {
        expect(parseVariationValue('Tamanho:P')).toBe('P');
        expect(parseVariationValue('Cor:Azul Marinho')).toBe('Azul Marinho');
    });

    it('tolera espaços em volta', () => {
        expect(parseVariationValue('  Tamanho : GG  ')).toBe('GG');
    });

    // Com dois atributos o Bling manda "Tamanho:P;Cor:Azul". Escolher um deles
    // arbitrariamente perderia informação e faria duas variantes distintas
    // parecerem iguais.
    it('preserva o texto inteiro quando há mais de um atributo', () => {
        expect(parseVariationValue('Tamanho:P;Cor:Azul')).toBe('Tamanho:P;Cor:Azul');
    });

    it('devolve o texto cru quando não há separador', () => {
        expect(parseVariationValue('Único')).toBe('Único');
    });

    it('devolve null para vazio', () => {
        expect(parseVariationValue('')).toBeNull();
        expect(parseVariationValue(undefined)).toBeNull();
        expect(parseVariationValue('Tamanho:')).toBeNull();
    });
});

describe('toVariantDrafts', () => {
    it('converte a grade real desta loja preservando saldo por tamanho', () => {
        const drafts = toVariantDrafts([
            variacaoReal(),
            variacaoReal({
                id: 16682834182,
                variacao: { nome: 'Tamanho:M', ordem: 2 },
                estoque: { saldoVirtualTotal: 8 },
            }),
            variacaoReal({
                id: 16682834190,
                variacao: { nome: 'Tamanho:GG', ordem: 4 },
                estoque: { saldoVirtualTotal: 0 },
            }),
        ]);

        expect(drafts.map((d) => [d.size, d.stock])).toEqual([
            ['P', 5],
            ['M', 8],
            ['GG', 0],
        ]);
    });

    it('ordena pela ordem do Bling, não pela ordem do array', () => {
        const drafts = toVariantDrafts([
            variacaoReal({ id: 3, variacao: { nome: 'Tamanho:G', ordem: 3 } }),
            variacaoReal({ id: 1, variacao: { nome: 'Tamanho:P', ordem: 1 } }),
            variacaoReal({ id: 2, variacao: { nome: 'Tamanho:M', ordem: 2 } }),
        ]);
        expect(drafts.map((d) => d.size)).toEqual(['P', 'M', 'G']);
    });

    // Sem id não há correlação no próximo sync — a variante viraria duplicata
    // a cada execução.
    it('descarta variação sem id utilizável', () => {
        const drafts = toVariantDrafts([
            variacaoReal(),
            { id: 0 } as BlingVariacao,
            { nome: 'sem id' } as BlingVariacao,
        ]);
        expect(drafts).toHaveLength(1);
    });

    it('deixa price nulo para herdar do pai quando o Bling não informa', () => {
        expect(toVariantDrafts([variacaoReal({ preco: 0 })])[0].price).toBeNull();
        expect(toVariantDrafts([variacaoReal({ preco: undefined })])[0].price).toBeNull();
    });

    it('grava price próprio quando a variação tem preço', () => {
        expect(toVariantDrafts([variacaoReal({ preco: 159.9 })])[0].price).toBe('159.9');
    });

    it('marca inativa a variação com situacao "I"', () => {
        expect(toVariantDrafts([variacaoReal({ situacao: 'I' })])[0].active).toBe(false);
    });

    it('nunca devolve estoque negativo ou fracionário', () => {
        expect(toVariantDrafts([variacaoReal({ estoque: { saldoVirtualTotal: -4 } })])[0].stock).toBe(0);
        expect(toVariantDrafts([variacaoReal({ estoque: { saldoVirtualTotal: 4.9 } })])[0].stock).toBe(4);
    });

    it('lista vazia ou ausente vira array vazio, não erro', () => {
        expect(toVariantDrafts(undefined)).toEqual([]);
        expect(toVariantDrafts([])).toEqual([]);
    });
});

/**
 * Este conjunto é o que impede os clones na vitrine: sem ele, os 4 filhos da
 * grade entram na listagem como produtos independentes — foi exatamente o que
 * aconteceu em produção (5 produtos criados em vez de 1).
 */
describe('collectVariationIds', () => {
    it('reúne os ids de filhos de todos os pais', () => {
        const ids = collectVariationIds([
            { variacoes: [variacaoReal({ id: 1 }), variacaoReal({ id: 2 })] },
            { variacoes: [variacaoReal({ id: 3 })] },
        ]);
        expect([...ids].sort()).toEqual([1, 2, 3]);
    });

    it('ignora pais sem variações e ids inválidos', () => {
        const ids = collectVariationIds([
            {},
            { variacoes: [] },
            { variacoes: [{ id: 0 } as BlingVariacao, variacaoReal({ id: 9 })] },
        ]);
        expect([...ids]).toEqual([9]);
    });
});
