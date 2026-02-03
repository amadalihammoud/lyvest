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

    // Se tiver API configurada, refinar com IA Especialista
    if (import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            const aiRecommendation = await getAIRecommendation(measurements, product);
            // Mesclar o fitMap do offline na resposta da IA se a IA não retornar (ou se quisermos forçar o offline map)
            return {
                ...aiRecommendation,
                fitMap: aiRecommendation.fitMap || offlineRecommendation.fitMap
            };
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
 * Recomendação usando GPT-4 com Prompt Especialista
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
    const categoryName = typeof categoryValue === 'string'
        ? categoryValue.toLowerCase()
        : Array.isArray(categoryValue)
            ? (categoryValue[0]?.slug || 'lingerie')
            : (categoryValue?.slug || 'lingerie');

    const sizeGuide = SIZE_GUIDE[categoryName] || SIZE_GUIDE.calcinhas;

    // CONTEXTO DE MEDIÇÃO POR CATEGORIA
    let contextPrompt = '';

    if (categoryName.includes('sutia') || categoryName.includes('top')) {
        contextPrompt = `
        CONTEXTO SUTIÃS E TOPS:
        - Sub-Busto (Tórax): ${measurements.exactUnderBust ? measurements.exactUnderBust + 'cm' : 'Não informado'} -> É a base. Define o número (40-52).
        - Busto: ${measurements.exactBust ? measurements.exactBust + 'cm' : 'Não informado'} -> Define a taça.
        - Priorize conforto da respiração se medida do tórax for limítrofe.
        - Se diferença Busto/Tórax for grande, alerte sobre necessidade de taça maior.`;
    }
    else if (categoryName.includes('calcinha') || categoryName.includes('cueca')) {
        contextPrompt = `
        CONTEXTO CALCINHAS E CUECAS:
        - Cintura: ${measurements.exactWaist ? measurements.exactWaist + 'cm' : 'Não informado'} -> Crucial para modeladores/hot pants.
        - Quadril: ${measurements.exactHips ? measurements.exactHips + 'cm' : 'Não informado'} -> Maior circunferência do glúteo.
        - Coxa: ${measurements.exactThigh ? measurements.exactThigh + 'cm' : 'Não informado'} -> Se disponível, use para evitar que enrole.`;
    }
    else if (categoryName.includes('pijama') || categoryName.includes('camisola') || categoryName.includes('robe')) {
        contextPrompt = `
        CONTEXTO PIJAMAS (CAMISOLAS/ROBES):
        - Foco na FLUIDEZ. Ninguém dorme com roupa apertada.
        - Use a maior medida (Busto ou Quadril) como determinante.`;
    }
    else if (categoryName.includes('meia')) {
        contextPrompt = `
        CONTEXTO MEIAS:
        - Nº Calçado: ${measurements.shoeSize || 'Não informado'} -> Base principal.
        - Panturrilha: ${measurements.exactCalf ? measurements.exactCalf + 'cm' : 'Não informado'} -> Determinante para 3/4 e 7/8. Evitar efeito garrote.`;
    }

    const measurementText = `
    MEDIDAS FORNECIDAS:
    - Altura/Peso: ${measurements.height}cm / ${measurements.weight}kg
    - Busto: ${measurements.exactBust || 'N/A'}
    - Tórax: ${measurements.exactUnderBust || 'N/A'}
    - Cintura: ${measurements.exactWaist || 'N/A'}
    - Quadril: ${measurements.exactHips || 'N/A'}
    - Coxa: ${measurements.exactThigh || 'N/A'}
    - Panturrilha: ${measurements.exactCalf || 'N/A'}
    - Calçado: ${measurements.shoeSize || 'N/A'}
    `;

    const prompt = `Você é o Especialista em Fit e Modelagem da LyVest, uma inteligência artificial focada em encontrar o tamanho ideal de lingerie e moda íntima.

MISSÃO: Garantir conforto absoluto, eliminando erro de compra e aumentando confiança.

${contextPrompt}

CLIENTE:
${measurementText}
- Tipo de corpo: ${translateBustType(measurements.bustType)} / ${translateHipType(measurements.hipType)}
- Preferência: ${measurements.fitPreference === 'snug' ? 'mais justo/modelador' : 'confortável/solto'}

PRODUTO:
- Nome: ${product.name}
- Categoria: ${categoryName}
- Descrição: ${product.description || ''}

TABELA DE MEDIDAS (REFERÊNCIA):
${JSON.stringify(sizeGuide, null, 2)}

INSTRUÇÕES DE SAÍDA:
1. Retorne sempre o tamanho sugerido (PP, P, M, G, GG) com % de certeza.
2. Justificativa: Explique de forma humanizada, focada em bem-estar.
   Ex: "Sugerimos o 44 porque oferece sustentação para costas sem apertar."
3. Dica Personalizada: Se houver desproporção (ex: costas finas, busto grande), dê uma dica de ouro.
4. Tom de Voz: Profissional, acolhedor, técnico porém acessível.

Retorne APENAS JSON válido:
{
  "size": "P",
  "confidence": 0.92,
  "reason": "Explicação humanizada...",
  "alternativeSize": "M"
}

A confiança deve ser entre 0.75 e 0.99.`;

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
