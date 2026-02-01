/*
 * Guia de Tamanhos e Tabelas de Referência
 * 
 * Define as medidas padrão para cada tamanho e categoria de produto
 */

export interface SizeGuideItem {
    bust: string;
    hip: string;
    waist?: string;
    weight: string;
}

export interface ReferenceModel {
    id: number;
    name: string;
    height: number; // cm
    weight: number; // kg
    bustType: 'small' | 'medium' | 'large';
    hipType: 'narrow' | 'medium' | 'wide';
    photo: string;
    testimonial: string;
    products: {
        productId: number;
        size: 'PP' | 'P' | 'M' | 'G' | 'GG';
        fit: 'snug' | 'comfortable';
    }[];
}

// Tabela de medidas por categoria
export const SIZE_GUIDE: Record<string, Record<string, SizeGuideItem>> = {
    calcinhas: {
        PP: { bust: '80-85cm', hip: '85-90cm', waist: '60-65cm', weight: '45-52kg' },
        P: { bust: '86-91cm', hip: '91-96cm', waist: '66-71cm', weight: '53-60kg' },
        M: { bust: '92-97cm', hip: '97-102cm', waist: '72-77cm', weight: '61-68kg' },
        G: { bust: '98-103cm', hip: '103-108cm', waist: '78-83cm', weight: '69-76kg' },
        GG: { bust: '104+cm', hip: '109+cm', waist: '84+cm', weight: '77+kg' },
    },
    sutias: {
        PP: { bust: '80-85cm', hip: '85-90cm', weight: '45-52kg' },
        P: { bust: '86-91cm', hip: '91-96cm', weight: '53-60kg' },
        M: { bust: '92-97cm', hip: '97-102cm', weight: '61-68kg' },
        G: { bust: '98-103cm', hip: '103-108cm', weight: '69-76kg' },
        GG: { bust: '104+cm', hip: '109+cm', weight: '77+kg' },
    },
    conjuntos: {
        PP: { bust: '80-85cm', hip: '85-90cm', waist: '60-65cm', weight: '45-52kg' },
        P: { bust: '86-91cm', hip: '91-96cm', waist: '66-71cm', weight: '53-60kg' },
        M: { bust: '92-97cm', hip: '97-102cm', waist: '72-77cm', weight: '61-68kg' },
        G: { bust: '98-103cm', hip: '103-108cm', waist: '78-83cm', weight: '69-76kg' },
        GG: { bust: '104+cm', hip: '109+cm', waist: '84+cm', weight: '77+kg' },
    },
    bodysuits: {
        PP: { bust: '80-85cm', hip: '85-90cm', waist: '60-65cm', weight: '45-52kg' },
        P: { bust: '86-91cm', hip: '91-96cm', waist: '66-71cm', weight: '53-60kg' },
        M: { bust: '92-97cm', hip: '97-102cm', waist: '72-77cm', weight: '61-68kg' },
        G: { bust: '98-103cm', hip: '103-108cm', waist: '78-83cm', weight: '69-76kg' },
        GG: { bust: '104+cm', hip: '109+cm', waist: '84+cm', weight: '77+kg' },
    },
};

// Modelos de referência para comparação visual
export const REFERENCE_MODELS: ReferenceModel[] = [
    {
        id: 1,
        name: 'Ana',
        height: 165,
        weight: 58,
        bustType: 'medium',
        hipType: 'medium',
        photo: '/images/models/ana.jpg',
        testimonial: 'Tamanho P ficou perfeito! Confortável e elegante.',
        products: [
            { productId: 1, size: 'P', fit: 'comfortable' },
            { productId: 5, size: 'P', fit: 'snug' },
        ],
    },
    {
        id: 2,
        name: 'Beatriz',
        height: 172,
        weight: 65,
        bustType: 'medium',
        hipType: 'wide',
        photo: '/images/models/beatriz.jpg',
        testimonial: 'Tamanho M se ajustou perfeitamente ao meu corpo!',
        products: [
            { productId: 2, size: 'M', fit: 'comfortable' },
            { productId: 8, size: 'M', fit: 'comfortable' },
        ],
    },
    {
        id: 3,
        name: 'Camila',
        height: 158,
        weight: 50,
        bustType: 'small',
        hipType: 'narrow',
        photo: '/images/models/camila.jpg',
        testimonial: 'PP é perfeito para quem é petite como eu!',
        products: [
            { productId: 1, size: 'PP', fit: 'comfortable' },
            { productId: 9, size: 'PP', fit: 'snug' },
        ],
    },
    {
        id: 4,
        name: 'Daniela',
        height: 168,
        weight: 72,
        bustType: 'large',
        hipType: 'wide',
        photo: '/images/models/daniela.jpg',
        testimonial: 'Tamanho G oferece ótimo suporte e conforto!',
        products: [
            { productId: 3, size: 'G', fit: 'comfortable' },
            { productId: 7, size: 'G', fit: 'comfortable' },
        ],
    },
    {
        id: 5,
        name: 'Eduarda',
        height: 175,
        weight: 80,
        bustType: 'large',
        hipType: 'wide',
        photo: '/images/models/eduarda.jpg',
        testimonial: 'GG ficou lindo! Muito confortável e valoriza as curvas.',
        products: [
            { productId: 4, size: 'GG', fit: 'comfortable' },
            { productId: 10, size: 'GG', fit: 'snug' },
        ],
    },
];

// Helper: Encontrar modelos similares baseado em medidas
export function findSimilarModels(
    height: number,
    weight: number,
    bustType: 'small' | 'medium' | 'large',
    hipType: 'narrow' | 'medium' | 'wide'
): ReferenceModel[] {
    return REFERENCE_MODELS
        .map(model => ({
            model,
            similarity: calculateSimilarity(model, { height, weight, bustType, hipType }),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(({ model }) => model);
}

function calculateSimilarity(
    model: ReferenceModel,
    user: { height: number; weight: number; bustType: string; hipType: string }
): number {
    let score = 100;

    // Diferença de altura (peso: 30%)
    const heightDiff = Math.abs(model.height - user.height);
    score -= (heightDiff / 2) * 0.3;

    // Diferença de peso (peso: 30%)
    const weightDiff = Math.abs(model.weight - user.weight);
    score -= (weightDiff / 2) * 0.3;

    // Tipo de busto (peso: 20%)
    if (model.bustType !== user.bustType) score -= 20;

    // Tipo de quadril (peso: 20%)
    if (model.hipType !== user.hipType) score -= 20;

    return Math.max(0, score);
}
