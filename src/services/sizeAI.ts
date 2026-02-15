/*
 * Serviço de IA para Recomendação de Tamanho
 * 
 * Usa GPT-4 para recomendar tamanho baseado nas medidas do usuário
 * Fallback para algoritmo offline se API falhar
 */

import { Product } from './ProductService';
import { SIZE_GUIDE } from '../data/sizeGuide';

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
    // Sempre tentar algoritmo offline primeiro (mais rápido)
    const offlineRecommendation = calculateOffline(measurements);

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

/**
 * Algoritmo offline baseado em BMI e tabela de medidas
 */
function calculateOffline(
    measurements: BodyMeasurements
): SizeRecommendation {
    const { exactBust, exactHips, exactWaist } = measurements;

    // SE tiver medidas exatas, usar lógica de fita métrica (Mais preciso)
    if (exactBust || exactHips || exactWaist) {
        return calculateFromExactMeasurements(measurements);
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

    // Determinar tamanho
    let size: 'PP' | 'P' | 'M' | 'G' | 'GG';
    let confidence: number;
    let reason: string;
    let alternativeSize: 'PP' | 'P' | 'M' | 'G' | 'GG' | undefined;

    if (sizeScore < 18) {
        size = 'PP';
        confidence = 0.85;
        reason = 'Baseado em seu peso e altura, o tamanho PP é ideal para você.';
        if (fitPreference === 'comfortable') alternativeSize = 'P';
    } else if (sizeScore < 21) {
        size = 'P';
        confidence = 0.90;
        reason = 'Tamanho P proporcionará o ajuste perfeito para suas medidas.';
        if (fitPreference === 'snug') alternativeSize = 'PP';
        else alternativeSize = 'M';
    } else if (sizeScore < 24) {
        size = 'M';
        confidence = 0.92;
        reason = 'Tamanho M é o mais equilibrado para seu tipo de corpo.';
        if (fitPreference === 'snug') alternativeSize = 'P';
        else alternativeSize = 'G';
    } else if (sizeScore < 27) {
        size = 'G';
        confidence = 0.88;
        reason = 'Tamanho G oferecerá conforto e bom caimento.';
        if (fitPreference === 'snug') alternativeSize = 'M';
        else alternativeSize = 'GG';
    } else {
        size = 'GG';
        confidence = 0.85;
        reason = 'Tamanho GG é perfeito para valorizar suas curvas com conforto.';
        if (fitPreference === 'snug') alternativeSize = 'G';
    }

    // Ajustar confiança baseado em tipo de corpo
    if (bustType === 'large' || hipType === 'wide') {
        confidence -= 0.05; // Menos certeza em extremos
    }

    return {
        size,
        confidence: Math.max(0.7, Math.min(0.95, confidence)),
        reason,
        alternativeSize,
        fitMap: generateFitMap(sizeScore, 18, 21, 24, 27) // Passar thresholds
    };
}

/**
 * Lógica para cálculo via Fita Métrica (CM exatos)
 */
function calculateFromExactMeasurements(measurements: BodyMeasurements): SizeRecommendation {
    const { exactBust, exactHips, exactWaist, fitPreference, age } = measurements;

    // Pontuações: PP=1, P=2, M=3, G=4, GG=5
    const scores: number[] = [];

    // Tabela simplificada BR
    if (exactBust && exactBust > 0) {
        if (exactBust <= 82) scores.push(1); // PP
        else if (exactBust <= 87) scores.push(2); // P
        else if (exactBust <= 92) scores.push(3); // M
        else if (exactBust <= 97) scores.push(4); // G
        else scores.push(exactBust <= 104 ? 5 : 5.5); // GG ou +
    }

    if (exactHips && exactHips > 0) {
        if (exactHips <= 90) scores.push(1); // PP
        else if (exactHips <= 96) scores.push(2); // P
        else if (exactHips <= 102) scores.push(3); // M
        else if (exactHips <= 108) scores.push(4); // G
        else scores.push(exactHips <= 116 ? 5 : 5.5); // GG
    }

    if (exactWaist && exactWaist > 0) {
        if (exactWaist <= 64) scores.push(1); // PP
        else if (exactWaist <= 70) scores.push(2); // P
        else if (exactWaist <= 76) scores.push(3); // M
        else if (exactWaist <= 82) scores.push(4); // G
        else scores.push(exactWaist <= 90 ? 5 : 5.5); // GG
    }

    // Se não tiver nenhuma medida válida (não deveria acontecer), fallback
    if (scores.length === 0) return calculateOffline({ ...measurements, exactBust: undefined, exactHips: undefined, exactWaist: undefined });

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Ajuste de preferência (se estiver entre tamanhos)
    // Ajuste de idade (similar ao offline, idade avançada prefere conforto)
    const ageAdjustment = (age && age > 50) ? 0.1 : 0;
    const finalScore = avgScore + (fitPreference === 'snug' ? -0.2 : 0.2) + ageAdjustment;

    let size: 'PP' | 'P' | 'M' | 'G' | 'GG';
    // Rounding logic
    if (finalScore <= 1.5) size = 'PP';
    else if (finalScore <= 2.5) size = 'P';
    else if (finalScore <= 3.5) size = 'M';
    else if (finalScore <= 4.5) size = 'G';
    else size = 'GG';

    // Se temos 2 ou mais medidas exatas, confiança sobe para 98%
    const validMeasurementsCount = (exactBust ? 1 : 0) + (exactHips ? 1 : 0) + (exactWaist ? 1 : 0);
    const confidence = validMeasurementsCount >= 2 ? 0.98 : 0.94;

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

function getNextSize(s: string): any {
    const sizes = ['PP', 'P', 'M', 'G', 'GG'];
    const idx = sizes.indexOf(s);
    return idx < sizes.length - 1 ? sizes[idx + 1] : undefined;
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
                name: product.name,
                category: product.category,
                description: product.description || '',
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

function translateBustType(type: string): string {
    const map: Record<string, string> = {
        small: 'pequeno',
        medium: 'médio',
        large: 'grande',
    };
    return map[type] || type;
}

function translateHipType(type: string): string {
    const map: Record<string, string> = {
        narrow: 'estreito',
        medium: 'médio',
        wide: 'largo',
    };
    return map[type] || type;
}
