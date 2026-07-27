import { describe, expect, it } from 'vitest';

import {
    buildCategoryTree,
    resolveMainImage,
    rowToProduct,
    type CatalogCategory,
    type ProductRow,
} from './catalog';

const row = (over: Partial<ProductRow> = {}): ProductRow => ({
    id: 'uuid-1',
    name: 'Sutiã Renda Comfort',
    slug: 'sutia-renda-comfort',
    description: 'Sem bojo',
    price: '149.90',
    promotionalPrice: null,
    imageUrl: 'https://cdn/x.webp',
    images: null,
    stock: 5,
    sizes: ['P', 'M'],
    colors: [{ name: 'Nude', hex: '#e8c' }],
    specs: { Material: 'Algodão' },
    ean: '789',
    badge: null,
    active: true,
    categoryName: 'Sutiãs',
    categorySlug: 'sutias',
    ...over,
});

/**
 * `price` é o número que o cliente vê. Ele NÃO é a autoridade da cobrança — o
 * checkout recalcula tudo no servidor — mas anunciar preço errado é problema de
 * confiança e de CDC, não só de UI.
 */
describe('resolveMainImage', () => {
    it('prefere image_url', () => {
        expect(resolveMainImage('https://a/1.webp', ['https://a/2.webp'])).toBe('https://a/1.webp');
    });

    it('cai para a primeira da galeria quando não há principal', () => {
        expect(resolveMainImage(null, ['https://a/2.webp'])).toBe('https://a/2.webp');
        expect(resolveMainImage('', ['https://a/2.webp'])).toBe('https://a/2.webp');
    });

    it('devolve string vazia quando não há imagem alguma', () => {
        expect(resolveMainImage(null, null)).toBe('');
        expect(resolveMainImage(null, [])).toBe('');
    });
});

/**
 * Fonte ÚNICA da conversão linha→Product. Existiam duas versões quase iguais
 * (grade e PDP) que divergiam em silêncio sobre imagem, rating e badge.
 */
describe('rowToProduct', () => {
    it('mapeia os campos essenciais do catálogo', () => {
        const p = rowToProduct(row());
        expect(p).toMatchObject({
            id: 'uuid-1',
            name: 'Sutiã Renda Comfort',
            price: 149.9,
            stock_quantity: 5,
            ean: '789',
            category: { name: 'Sutiãs', slug: 'sutias' },
        });
    });

    it('trata colunas anuláveis sem produzir undefined na UI', () => {
        const p = rowToProduct(
            row({ description: null, stock: null, colors: null, specs: null, sizes: null })
        );
        expect(p.description).toBe('');
        expect(p.stock_quantity).toBe(0);
        expect(p.colors).toEqual([]);
        expect(p.specs).toEqual({});
    });

// O slug vem da COLUNA, nunca derivado do nome. A PDP consulta
    // products.slug; se a UI derivasse do nome, um rename no Bling quebraria
    // todo link — inclusive os ja indexados pelo Google.
    it('propaga o slug do banco, sem deriva-lo do nome', () => {
        const p = rowToProduct(row({ name: 'Nome Novo Depois do Rename', slug: 'slug-antigo-indexado' }));
        expect(p.slug).toBe('slug-antigo-indexado');
    });

    it('omite categoria quando o produto não tem uma (LEFT JOIN sem par)', () => {
        expect(rowToProduct(row({ categoryName: null })).category).toBeUndefined();
    });

    it('propaga o rating com a média PRECISA, não arredondada', () => {
        // O consumidor é o JSON-LD da PDP, onde 4.3 vale mais que 4.0.
        const p = rowToProduct(row(), { avg: 4.333, count: 12 });
        expect(p.rating).toBe(4.333);
        expect(p.reviews).toBe(12);
    });

    it('deixa rating e reviews indefinidos quando não há avaliação', () => {
        const p = rowToProduct(row());
        expect(p.rating).toBeUndefined();
        expect(p.reviews).toBeUndefined();
    });
});

describe('buildCategoryTree', () => {
    const cat = (id: string, parentId: string | null): CatalogCategory => ({
        id,
        name: id,
        slug: id,
        parentId,
    });

    it('aninha filhos sob os pais', () => {
        const tree = buildCategoryTree([cat('fem', null), cat('sutia', 'fem')]);
        expect(tree).toHaveLength(1);
        expect(tree[0].children.map((c) => c.id)).toEqual(['sutia']);
    });

    it('trata filho órfão (pai ausente) como raiz, em vez de sumir com ele', () => {
        const tree = buildCategoryTree([cat('sutia', 'inexistente')]);
        expect(tree.map((c) => c.id)).toEqual(['sutia']);
    });

    it('não depende da ordem: pai depois do filho na lista', () => {
        const tree = buildCategoryTree([cat('sutia', 'fem'), cat('fem', null)]);
        expect(tree).toHaveLength(1);
        expect(tree[0].id).toBe('fem');
    });
});
