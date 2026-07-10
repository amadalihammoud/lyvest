/*
 * Serviço de IA para Recomendação de Tamanho
 * 
 * Usa GPT-4 para recomendar tamanho baseado nas medidas do usuário
 * Fallback para algoritmo offline se API falhar
 */

import { Product } from './ProductService';
import { CategorySlug, SIZE_CHARTS, normalizeCategorySlug, upperBounds } from '../data/sizeChart';

export interface BodyMeasurements {
    height: number; // cm
    weight: number; // kg
    age?: number; // anos (Novo)
    bustType: 'small' | 'medium' | 'large';
    hipType: 'narrow' | 'medium' | 'wide';
    fitPreference: 'snug' | 'comfortable';

    // Medidas Avançadas (Especialista em Fit)
    exactBust?: number;    // Busto Total
    exactUnderBust?: number; // Tórax / Sub-busto (Novo)
    exactWaist?: number;   // Cintura (Umbigo)
    exactHips?: number;    // Quadril
    exactThigh?: number;   // Coxa (Novo)
    exactCalf?: number;    // Panturrilha (Novo)
    shoeSize?: number;     // Calçado (Novo)
    shoulderWidth?: number; // Largura dos Ombros (Novo)
}

export type FitType = 'tight' | 'perfect' | 'loose';

export interface SizeRecommendation {
    size: 'PP' | 'P' | 'M' | 'G' | 'GG';
    confidence: number; // 0-1
    reason: string;
    alternativeSize?: 'PP' | 'P' | 'M' | 'G' | 'GG';
    fitMap?: Record<string, FitType>; // Novo: Mapa de fit relativo
}

/**
 * Calcula o tamanho recomendado usando IA
 */
export async function calculateSize(
    measurements: BodyMeasurements,
    product: Product
): Promise<SizeRecommendation> {
    const categorySlug = normalizeCategorySlug(product.category);

    // Sempre tentar algoritmo offline primeiro (mais rápido)
    const offlineRecommendation = calculateOffline(measurements, categorySlug);

    // Tentar refinar com IA via API Route segura (chave fica no servidor)
    try {
        const aiRecommendation = await getAIRecommendation(measurements, product);
        return {
            ...aiRecommendation,
            fitMap: aiRecommendation.fitMap || offlineRecommendation.fitMap
        };
    } catch (error) {
        // IA indisponível ou não configurada — usar algoritmo offline
        console.warn('IA indisponível, usando algoritmo offline:', error);
        return offlineRecommendation;
    }
}

// Determina tamanho estimado a partir do score (extraído para reduzir complexidade).
function determineEstimatedSize(
    sizeScore: number,
    fitPreference: 'snug' | 'comfortable'
): { size: 'PP' | 'P' | 'M' | 'G' | 'GG'; confidence: number; reason: string; alternativeSize?: 'PP' | 'P' | 'M' | 'G' | 'GG' } {
    if (sizeScore < 18) {
        return { size: 'PP', confidence: 0.85, reason: 'Baseado em seu peso e altura, o tamanho PP é ideal para você.', alternativeSize: fitPreference === 'comfortable' ? 'P' : undefined };
    }
    if (sizeScore < 21) {
        return { size: 'P', confidence: 0.90, reason: 'Tamanho P proporcionará o ajuste perfeito para suas medidas.', alternativeSize: fitPreference === 'snug' ? 'PP' : 'M' };
    }
    if (sizeScore < 24) {
        return { size: 'M', confidence: 0.92, reason: 'Tamanho M é o mais equilibrado para seu tipo de corpo.', alternativeSize: fitPreference === 'snug' ? 'P' : 'G' };
    }
    if (sizeScore < 27) {
        return { size: 'G', confidence: 0.88, reason: 'Tamanho G oferecerá conforto e bom caimento.', alternativeSize: fitPreference === 'snug' ? 'M' : 'GG' };
    }
    return { size: 'GG', confidence: 0.85, reason: 'Tamanho GG é perfeito para valorizar suas curvas com conforto.', alternativeSize: fitPreference === 'snug' ? 'G' : undefined };
}

/**
 * Algoritmo offline baseado em BMI e tabela de medidas
 */
function calculateOffline(
    measurements: BodyMeasurements,
    categorySlug: CategorySlug = 'lingerie'
): SizeRecommendation {
    const { exactBust, exactHips, exactWaist, exactUnderBust } = measurements;

    // SE tiver medidas exatas, usar lógica de fita métrica (Mais preciso)
    if (exactBust || exactHips || exactWaist || exactUnderBust) {
        return calculateFromExactMeasurements(measurements, categorySlug);
    }

    // SENÃO usar lógica estimativa (Peso/Altura)
    const { height, weight, age, bustType, hipType, fitPreference } = measurements;

    // Calcular BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // Ajustes baseados em tipo de corpo
    const bustAdjustment = getBustAdjustment(bustType);
    const hipAdjustment = getHipAdjustment(hipType);
    const fitAdjustment = fitPreference === 'snug' ? -0.5 : 0.5;

    // Ajuste de idade: metabolismo tende a acumular mais peso central com idade
    // Se > 40, assume que precisa de um pouco mais de conforto (score sobe levemente em direção a tamanhos maiores)
    const ageAdjustment = (age && age > 40) ? 0.3 : 0;

    // Score final
    const sizeScore = bmi + bustAdjustment + hipAdjustment + fitAdjustment + ageAdjustment;

    // Determinar tamanho (lógica extraída para reduzir complexidade)
    const sizeInfo = determineEstimatedSize(sizeScore, fitPreference);
    let confidence = sizeInfo.confidence;

    // Ajustar confiança baseado em tipo de corpo
    if (bustType === 'large' || hipType === 'wide') {
        confidence -= 0.05; // Menos certeza em extremos
    }

    return {
        size: sizeInfo.size,
        confidence: Math.max(0.7, Math.min(0.95, confidence)),
        reason: sizeInfo.reason,
        alternativeSize: sizeInfo.alternativeSize,
        fitMap: generateFitMap(sizeScore, 18, 21, 24, 27) // Passar thresholds
    };
}

// Mapeia uma medida (cm) para score PP=1..GG=5 (5.5 = acima de GG) via limites
// superiores de cada tamanho, derivados da tabela canônica (sizeChart.ts).
function scoreMeasurement(value: number, bounds: number[]): number {
    for (let i = 0; i < bounds.length; i++) {
        if (value <= bounds[i]) return i + 1;
    }
    return bounds.length + 0.5; // acima do maior tamanho
}

// Arredonda o score final para um tamanho nominal (mesmos limites da lógica original).
function scoreToNominalSize(finalScore: number): 'PP' | 'P' | 'M' | 'G' | 'GG' {
    if (finalScore <= 1.5) return 'PP';
    if (finalScore <= 2.5) return 'P';
    if (finalScore <= 3.5) return 'M';
    if (finalScore <= 4.5) return 'G';
    return 'GG';
}

/**
 * Lógica para cálculo via Fita Métrica (CM exatos).
 * Usa APENAS as medidas que a tabela da categoria realmente define — ex.: sutiã pontua
 * por busto + sob-busto (a taça é a diferença entre eles); calcinha/cueca por cintura + quadril.
 */
function calculateFromExactMeasurements(
    measurements: BodyMeasurements,
    categorySlug: CategorySlug
): SizeRecommendation {
    const { exactBust, exactHips, exactWaist, exactUnderBust, fitPreference, age } = measurements;
    const chart = SIZE_CHARTS[categorySlug];

    // Pontuações: PP=1..GG=5, com limites derivados da tabela canônica da categoria
    const scores: number[] = [];
    const scoreIf = (value: number | undefined, key: 'bust' | 'underbust' | 'waist' | 'hip') => {
        const bounds = upperBounds(chart, key);
        if (value && value > 0 && bounds) scores.push(scoreMeasurement(value, bounds));
    };
    scoreIf(exactBust, 'bust');
    scoreIf(exactUnderBust, 'underbust');
    scoreIf(exactWaist, 'waist');
    scoreIf(exactHips, 'hip');

    // Se não tiver nenhuma medida válida (não deveria acontecer), fallback
    if (scores.length === 0) return calculateOffline({ ...measurements, exactBust: undefined, exactHips: undefined, exactWaist: undefined, exactUnderBust: undefined }, categorySlug);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Ajuste de preferência (se estiver entre tamanhos)
    // Ajuste de idade (similar ao offline, idade avançada prefere conforto)
    const ageAdjustment = (age && age > 50) ? 0.1 : 0;
    const finalScore = avgScore + (fitPreference === 'snug' ? -0.2 : 0.2) + ageAdjustment;

    const size = scoreToNominalSize(finalScore);

    // Se temos 2 ou mais medidas exatas, confiança sobe para 98%
    // (scores.length é exatamente o nº de medidas válidas — mesmos guards value > 0 acima)
    const confidence = scores.length >= 2 ? 0.98 : 0.94;

    return {
        size,
        confidence,
        reason: 'Baseado nas suas medidas exatas, este é o tamanho tecnicamente perfeito para seu corpo.',
        alternativeSize: finalScore % 1 > 0.6 ? getNextSize(size) : undefined,
        fitMap: generateFitMap(finalScore, 1.5, 2.5, 3.5, 4.5)
    };
}

/**
 * Gera mapa de fit relativo baseado no score calculado
 */
function generateFitMap(score: number, t1: number, _t2: number, _t3: number, _t4: number): Record<string, FitType> {
    const map: Record<string, FitType> = {
        PP: 'tight',
        P: 'tight',
        M: 'tight',
        G: 'tight',
        GG: 'tight'
    };

    // Função auxiliar para determinar fit de um tamanho específico dado o score ideal do usuário
    // Ex: score = 3.2 (Usuário é M um pouco folgado).
    // Tamanho M (Center ~ 3.0) -> Perfeito
    // Tamanho P (Center ~ 2.0) -> Apertado
    // Tamanho G (Center ~ 4.0) -> Largo

    // Simplificando lógica baseada em thresholds
    const checkFit = (sizeCenter: number, userScore: number): FitType => {
        const diff = userScore - sizeCenter;
        if (diff > 0.6) return 'tight'; // Usuário é maior que o tamanho
        if (diff < -0.6) return 'loose'; // Usuário é menor que o tamanho
        return 'perfect';
    };

    // Deduzindo centros aproximados dos tamanhos baseados nos thresholds
    // t1=1.5 (limit PP/P) -> PP~1.0, P~2.0, etc.
    // Para offline mode os números são maiores (BMI ~20), então precisamos normalizar

    let centers: Record<string, number>;

    if (t1 > 10) { // Modo BMI (Scores ~18-27)
        centers = { 'PP': 16.5, 'P': 19.5, 'M': 22.5, 'G': 25.5, 'GG': 28.5 };
    } else { // Modo Exact (Scores 1-5)
        centers = { 'PP': 1.0, 'P': 2.0, 'M': 3.0, 'G': 4.0, 'GG': 5.0 };
    }

    map.PP = checkFit(centers.PP, score);
    map.P = checkFit(centers.P, score);
    map.M = checkFit(centers.M, score);
    map.G = checkFit(centers.G, score);
    map.GG = checkFit(centers.GG, score);

    return map;
}

function getNextSize(s: string): 'PP' | 'P' | 'M' | 'G' | 'GG' | undefined {
    const sizes = ['PP', 'P', 'M', 'G', 'GG'] as const;
    const idx = sizes.indexOf(s as typeof sizes[number]);
    return idx >= 0 && idx < sizes.length - 1 ? sizes[idx + 1] : undefined;
}

/**
 * Recomendação via API Route segura (chave OpenAI fica no servidor)
 */
async function getAIRecommendation(
    measurements: BodyMeasurements,
    product: Product
): Promise<SizeRecommendation> {
    const response = await fetch('/api/ai/size-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            measurements,
            product: {
                // Só id/nome/categoria: o servidor decide a tabela de medidas
                // (ficha do produto no Supabase ou tabela canônica da categoria).
                id: product.id,
                name: product.name,
                category: product.category,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
    }

    return response.json();
}

// Helpers
function getBustAdjustment(bustType: 'small' | 'medium' | 'large'): number {
    switch (bustType) {
        case 'small':
            return -1;
        case 'large':
            return 1;
        default:
            return 0;
    }
}

function getHipAdjustment(hipType: 'narrow' | 'medium' | 'wide'): number {
    switch (hipType) {
        case 'narrow':
            return -0.5;
        case 'wide':
            return 0.5;
        default:
            return 0;
    }
}

