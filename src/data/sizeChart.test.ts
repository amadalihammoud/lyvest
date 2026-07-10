import { describe, expect, it } from 'vitest';

import {
    chartToPromptTable,
    formatRange,
    getSizeChart,
    normalizeCategorySlug,
    SIZE_CHARTS,
    upperBounds,
} from './sizeChart';

describe('normalizeCategorySlug', () => {
    // Regressão do bug original: "Sutiãs" (acento + plural) caía no fallback de calcinhas
    it('normaliza categorias com acento e plural dos produtos reais', () => {
        expect(normalizeCategorySlug('Sutiãs')).toBe('sutia');
        expect(normalizeCategorySlug('Sutiã')).toBe('sutia');
        expect(normalizeCategorySlug('Calcinhas')).toBe('calcinha');
        expect(normalizeCategorySlug('Cuecas')).toBe('cueca');
        expect(normalizeCategorySlug('Pijamas')).toBe('pijama');
        expect(normalizeCategorySlug('Meias')).toBe('meia');
    });

    it('aceita objeto de categoria do Supabase ({name, slug})', () => {
        expect(normalizeCategorySlug({ name: 'Sutiãs', slug: 'sutias' })).toBe('sutia');
        expect(normalizeCategorySlug({ name: 'Bodys' })).toBe('bodysuit');
    });

    it('aceita array de categorias (primeira vence)', () => {
        expect(normalizeCategorySlug([{ slug: 'pijamas' }])).toBe('pijama');
    });

    it('cai no genérico para categoria desconhecida ou vazia', () => {
        expect(normalizeCategorySlug('Novidades')).toBe('lingerie');
        expect(normalizeCategorySlug(undefined)).toBe('lingerie');
        expect(normalizeCategorySlug(null)).toBe('lingerie');
        expect(normalizeCategorySlug('')).toBe('lingerie');
    });

    it('detecta pelo nome do produto quando usado como fallback', () => {
        expect(normalizeCategorySlug('Sutiã Renda Francesa')).toBe('sutia');
        expect(normalizeCategorySlug('Camisola de Seda')).toBe('pijama');
    });
});

describe('getSizeChart', () => {
    it('sutiã tem busto, sob-busto e numeração — sem cintura/quadril', () => {
        const { slug, rows } = getSizeChart('Sutiãs');
        expect(slug).toBe('sutia');
        for (const row of rows) {
            expect(row.bust).toBeDefined();
            expect(row.underbust).toBeDefined();
            expect(row.braNumber).toBeDefined();
            expect(row.waist).toBeUndefined();
            expect(row.hip).toBeUndefined();
        }
    });

    it('cueca tem cintura e quadril — sem busto', () => {
        const { rows } = getSizeChart('Cuecas');
        for (const row of rows) {
            expect(row.waist).toBeDefined();
            expect(row.hip).toBeDefined();
            expect(row.bust).toBeUndefined();
        }
    });

    it('todas as categorias têm os 5 tamanhos em ordem', () => {
        for (const rows of Object.values(SIZE_CHARTS)) {
            expect(rows.map((r) => r.size)).toEqual(['PP', 'P', 'M', 'G', 'GG']);
        }
    });

    it('intervalos são crescentes e sem sobreposição (min > max do anterior)', () => {
        for (const rows of Object.values(SIZE_CHARTS)) {
            for (const key of ['bust', 'underbust', 'waist', 'hip'] as const) {
                const ranges = rows.map((r) => r[key]).filter(Boolean) as { min: number; max: number }[];
                for (let i = 0; i < ranges.length; i++) {
                    expect(ranges[i].min).toBeLessThanOrEqual(ranges[i].max);
                    if (i > 0) expect(ranges[i].min).toBeGreaterThan(ranges[i - 1].max);
                }
            }
        }
    });
});

describe('upperBounds', () => {
    it('deriva os limites do algoritmo da mesma tabela exibida no guia', () => {
        expect(upperBounds(SIZE_CHARTS.sutia, 'bust')).toEqual([82, 87, 92, 97, 102]);
        expect(upperBounds(SIZE_CHARTS.sutia, 'underbust')).toEqual([67, 72, 77, 82, 87]);
    });

    it('retorna null para medida que a categoria não define', () => {
        expect(upperBounds(SIZE_CHARTS.sutia, 'hip')).toBeNull();
        expect(upperBounds(SIZE_CHARTS.cueca, 'bust')).toBeNull();
    });
});

describe('formatRange / chartToPromptTable', () => {
    it('formata intervalos e serializa a tabela para o prompt', () => {
        expect(formatRange({ min: 78, max: 82 })).toBe('78-82');
        expect(formatRange(undefined)).toBe('—');

        const table = chartToPromptTable(SIZE_CHARTS.sutia);
        expect(table).toContain('M: busto 88-92cm sob-busto 73-77cm numeração 42-44');
        expect(table.split('\n')).toHaveLength(5);
    });
});
