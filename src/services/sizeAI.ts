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
    bustType: 'small' | 'medium' | 'large';
    hipType: 'narrow' | 'medium' | 'wide';
    fitPreference: 'snug' | 'comfortable';
    // Medidas exatas (opcionais p/ Modo Avançado)
    exactBust?: number;
    exactWaist?: number;
    exactHips?: number;
}

export interface SizeRecommendation {
    size: 'PP' | 'P' | 'M' | 'G' | 'GG';
    confidence: number; // 0-1
    reason: string;
    alternativeSize?: 'PP' | 'P' | 'M' | 'G' | 'GG';
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

    // Se tiver API configurada, refinar com IA
    if (import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            const aiRecommendation = await getAIRecommendation(measurements, product);
            return aiRecommendation;
        } catch (error) {
            console.warn('IA indisponível, usando algoritmo offline:', error);
            return offlineRecommendation;
        }
    }

    return offlineRecommendation;
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
    const { height, weight, bustType, hipType, fitPreference } = measurements;

    // Calcular BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // Ajustes baseados em tipo de corpo
    const bustAdjustment = getBustAdjustment(bustType);
    const hipAdjustment = getHipAdjustment(hipType);
    const fitAdjustment = fitPreference === 'snug' ? -0.5 : 0.5;

    // Score final
    const sizeScore = bmi + bustAdjustment + hipAdjustment + fitAdjustment;

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
    };
}

/**
 * Lógica para cálculo via Fita Métrica (CM exatos)
 */
function calculateFromExactMeasurements(measurements: BodyMeasurements): SizeRecommendation {
    const { exactBust, exactHips, exactWaist, fitPreference } = measurements;

    // Pontuações: PP=1, P=2, M=3, G=4, GG=5
    let scores: number[] = [];

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
    const finalScore = avgScore + (fitPreference === 'snug' ? -0.2 : 0.2);

    let size: 'PP' | 'P' | 'M' | 'G' | 'GG';
    // Rounding logic
    if (finalScore <= 1.5) size = 'PP';
    else if (finalScore <= 2.5) size = 'P';
    else if (finalScore <= 3.5) size = 'M';
    else if (finalScore <= 4.5) size = 'G';
    else size = 'GG';

    return {
        size,
        confidence: 0.96, // Confiança alta pois são medidas exatas
        reason: 'Baseado nas suas medidas exatas (busto, cintura e quadril), este é o tamanho tecnicamente perfeito.',
        alternativeSize: finalScore % 1 > 0.6 ? getNextSize(size) : undefined
    };
}

function getNextSize(s: string): any {
    const sizes = ['PP', 'P', 'M', 'G', 'GG'];
    const idx = sizes.indexOf(s);
    return idx < sizes.length - 1 ? sizes[idx + 1] : undefined;
}

/**
 * Recomendação usando GPT-4 (quando disponível)
 */
async function getAIRecommendation(
    measurements: BodyMeasurements,
    product: Product
): Promise<SizeRecommendation> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const categoryValue = product.category;
    const category =
        typeof categoryValue === 'string'
            ? categoryValue.toLowerCase()
            : Array.isArray(categoryValue)
                ? (categoryValue[0]?.slug || 'lingerie')
                : (categoryValue?.slug || 'lingerie');
    const sizeGuide = SIZE_GUIDE[category] || SIZE_GUIDE.calcinhas;

    const measurementText = measurements.exactBust
        ? `MEDIDAS EXATAS:\n- Busto: ${measurements.exactBust}cm\n- Cintura: ${measurements.exactWaist}cm\n- Quadril: ${measurements.exactHips}cm`
        : `- Altura: ${measurements.height}cm\n- Peso: ${measurements.weight}kg`;

    const prompt = `Você é uma consultora especialista em moda íntima feminina brasileira com 20 anos de experiência.

CLIENTE:
${measurementText}
- Tipo de busto: ${translateBustType(measurements.bustType)}
- Tipo de quadril: ${translateHipType(measurements.hipType)}
- Preferência de ajuste: ${measurements.fitPreference === 'snug' ? 'mais justo/modelador' : 'confortável/solto'}

PRODUTO:
- Nome: ${product.name}
- Categoria: ${category}
- Descrição: ${product.description || ''}

TABELA DE MEDIDAS DISPONÍVEIS:
${JSON.stringify(sizeGuide, null, 2)}

TAMANHOS DISPONÍVEIS: PP, P, M, G, GG

TAREFA:
Recomende o tamanho PERFEITO para esta cliente, considerando:
1. Conforto e caimento ideal
2. Preferência de ajuste dela
3. Tipo específico de produto
4. Padrão brasileiro de numeração

Retorne APENAS um objeto JSON válido (sem markdown):
{
  "size": "P",
  "confidence": 0.92,
  "reason": "Explicação clara e amigável do porquê este tamanho é ideal",
  "alternativeSize": "M"
}

IMPORTANTE: A confiança deve ser entre 0.75 e 0.98. Seja honesta se houver dúvida.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini', // Mais barato e rápido
            messages: [
                {
                    role: 'system',
                    content: 'Você é uma consultora de moda íntima. Sempre retorne JSON válido.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3, // Mais determinístico
            max_tokens: 200,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return JSON.parse(content);
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
