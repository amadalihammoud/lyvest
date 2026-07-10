/*
 * Fonte ÚNICA de verdade para tamanhos e medidas (corpo, em cm).
 *
 * Antes desta refatoração existiam 3 tabelas divergentes (SIZE_GUIDE em sizeGuide.ts,
 * tabela hardcoded no SizeGuideModal e thresholds soltos em sizeAI.ts). Agora TODOS os
 * consumidores derivam daqui — guia visual, algoritmo offline e prompt da IA.
 *
 * IMPORTANTE: estas são MEDIDAS DO CORPO da usuária (o que a fita métrica mede),
 * não medidas da peça esticada. Fichas técnicas de fornecedor devem ser cadastradas
 * por produto na tabela `size_charts` do Supabase (ver migration 006) — esta tabela
 * canônica é o fallback por categoria enquanto o produto não tem ficha própria.
 */

export type SizeLabel = 'PP' | 'P' | 'M' | 'G' | 'GG';

export type CategorySlug =
    | 'sutia'
    | 'calcinha'
    | 'cueca'
    | 'conjunto'
    | 'bodysuit'
    | 'pijama'
    | 'meia'
    | 'lingerie'; // padrão/genérico

export interface MeasureRange {
    min: number;
    max: number;
}

export interface SizeChartRow {
    size: SizeLabel;
    bust?: MeasureRange; // busto (ponto mais cheio)
    underbust?: MeasureRange; // sob-busto / tórax
    waist?: MeasureRange; // cintura (umbigo)
    hip?: MeasureRange; // quadril
    shoulders?: MeasureRange; // ombros (pijamas)
    shoeBR?: MeasureRange; // numeração de calçado (meias)
    footCm?: MeasureRange; // comprimento do pé (meias)
    braNumber?: string; // numeração BR do sutiã correspondente (ex.: '42-44')
}

export const SIZE_ORDER: readonly SizeLabel[] = ['PP', 'P', 'M', 'G', 'GG'] as const;

/**
 * Normaliza qualquer representação de categoria (string com/sem acento, singular/plural,
 * objeto {name, slug} do Supabase ou array) para um slug canônico.
 *
 * Ex.: "Sutiãs" → 'sutia' · "calcinha" → 'calcinha' · { slug: 'pijamas' } → 'pijama'
 */
export function normalizeCategorySlug(category: unknown): CategorySlug {
    const raw = extractCategoryText(category);
    const s = stripDiacritics(raw.toLowerCase());

    if (matches(s, ['sutia', 'soutien', 'bra', 'bralette', 'top'])) return 'sutia';
    if (matches(s, ['calcinha', 'panty', 'tanga', 'fio dental'])) return 'calcinha';
    if (matches(s, ['cueca', 'boxer', 'samba cancao'])) return 'cueca';
    if (matches(s, ['conjunto'])) return 'conjunto';
    if (matches(s, ['body'])) return 'bodysuit';
    if (matches(s, ['pijama', 'camisola', 'robe', 'sleepwear'])) return 'pijama';
    if (matches(s, ['meia', 'sock', 'sapatilha'])) return 'meia';
    return 'lingerie';
}

function extractCategoryText(category: unknown): string {
    if (typeof category === 'string') return category;
    if (Array.isArray(category)) return extractCategoryText(category[0]);
    if (category && typeof category === 'object') {
        const c = category as { slug?: unknown; name?: unknown };
        if (typeof c.slug === 'string') return c.slug;
        if (typeof c.name === 'string') return c.name;
    }
    return '';
}

function stripDiacritics(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matches(s: string, keywords: string[]): boolean {
    return keywords.some((k) => s.includes(k));
}

// ---------------------------------------------------------------------------
// Tabela canônica (medidas do corpo, cm)
// ---------------------------------------------------------------------------

const r = (min: number, max: number): MeasureRange => ({ min, max });

// Base feminina (calcinhas, conjuntos, bodysuits, lingerie genérica)
const FEMININO_BASE: SizeChartRow[] = [
    { size: 'PP', bust: r(78, 82), waist: r(58, 62), hip: r(84, 88) },
    { size: 'P', bust: r(83, 87), waist: r(63, 67), hip: r(89, 93) },
    { size: 'M', bust: r(88, 92), waist: r(68, 72), hip: r(94, 98) },
    { size: 'G', bust: r(93, 97), waist: r(73, 77), hip: r(99, 103) },
    { size: 'GG', bust: r(98, 102), waist: r(78, 82), hip: r(104, 108) },
];

const SUTIA: SizeChartRow[] = [
    { size: 'PP', bust: r(78, 82), underbust: r(63, 67), braNumber: '38-40' },
    { size: 'P', bust: r(83, 87), underbust: r(68, 72), braNumber: '40-42' },
    { size: 'M', bust: r(88, 92), underbust: r(73, 77), braNumber: '42-44' },
    { size: 'G', bust: r(93, 97), underbust: r(78, 82), braNumber: '44-46' },
    { size: 'GG', bust: r(98, 102), underbust: r(83, 87), braNumber: '46-48' },
];

// Masculino (cuecas): cintura e quadril
const CUECA: SizeChartRow[] = [
    { size: 'PP', waist: r(62, 69), hip: r(82, 87) },
    { size: 'P', waist: r(70, 77), hip: r(88, 93) },
    { size: 'M', waist: r(78, 85), hip: r(94, 99) },
    { size: 'G', waist: r(86, 93), hip: r(100, 105) },
    { size: 'GG', waist: r(94, 102), hip: r(106, 112) },
];

const PIJAMA: SizeChartRow[] = FEMININO_BASE.map((row, i) => ({
    ...row,
    shoulders: [r(35, 37), r(38, 40), r(41, 43), r(44, 46), r(47, 49)][i],
}));

const MEIA: SizeChartRow[] = [
    { size: 'PP', shoeBR: r(33, 35), footCm: r(21, 22) },
    { size: 'P', shoeBR: r(36, 38), footCm: r(23, 24) },
    { size: 'M', shoeBR: r(39, 40), footCm: r(25, 26) },
    { size: 'G', shoeBR: r(41, 42), footCm: r(27, 28) },
    { size: 'GG', shoeBR: r(43, 44), footCm: r(29, 30) },
];

export const SIZE_CHARTS: Record<CategorySlug, SizeChartRow[]> = {
    sutia: SUTIA,
    calcinha: FEMININO_BASE,
    cueca: CUECA,
    conjunto: FEMININO_BASE,
    bodysuit: FEMININO_BASE,
    pijama: PIJAMA,
    meia: MEIA,
    lingerie: FEMININO_BASE,
};

/** Tabela de medidas para uma categoria em qualquer formato (string/objeto/array). */
export function getSizeChart(category: unknown): { slug: CategorySlug; rows: SizeChartRow[] } {
    const slug = normalizeCategorySlug(category);
    return { slug, rows: SIZE_CHARTS[slug] };
}

/**
 * Limites superiores (cm) de cada tamanho para uma medida — usados pelo algoritmo
 * offline de recomendação. Derivados da tabela canônica para nunca divergirem dela.
 * Retorna null se a categoria não usa essa medida (ex.: quadril em sutiãs).
 */
export function upperBounds(
    rows: SizeChartRow[],
    key: 'bust' | 'underbust' | 'waist' | 'hip'
): number[] | null {
    const bounds = rows.map((row) => row[key]?.max);
    if (bounds.some((b) => b === undefined)) return null;
    return bounds as number[];
}

/** Formata um intervalo para exibição: {min:78,max:82} → "78-82" */
export function formatRange(range?: MeasureRange): string {
    return range ? `${range.min}-${range.max}` : '—';
}

/**
 * Serializa a tabela num formato compacto e legível para o prompt da IA
 * (menos tokens que JSON.stringify da estrutura inteira).
 */
export function chartToPromptTable(rows: SizeChartRow[]): string {
    return rows
        .map((row) => {
            const parts: string[] = [`${row.size}:`];
            if (row.bust) parts.push(`busto ${formatRange(row.bust)}cm`);
            if (row.underbust) parts.push(`sob-busto ${formatRange(row.underbust)}cm`);
            if (row.waist) parts.push(`cintura ${formatRange(row.waist)}cm`);
            if (row.hip) parts.push(`quadril ${formatRange(row.hip)}cm`);
            if (row.shoulders) parts.push(`ombros ${formatRange(row.shoulders)}cm`);
            if (row.shoeBR) parts.push(`calçado ${formatRange(row.shoeBR)}`);
            if (row.braNumber) parts.push(`numeração ${row.braNumber}`);
            return parts.join(' ');
        })
        .join('\n');
}
