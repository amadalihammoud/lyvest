import { NextRequest, NextResponse } from 'next/server';

import { SIZE_GUIDE } from '@/data/sizeGuide';

/**
 * Server-side API Route for OpenAI size recommendations.
 * This keeps the OpenAI API key secure (never sent to the browser).
 */

interface BodyMeasurements {
    height: number;
    weight: number;
    age?: number;
    bustType: 'small' | 'medium' | 'large';
    hipType: 'narrow' | 'medium' | 'wide';
    fitPreference: 'snug' | 'comfortable';
    exactBust?: number;
    exactUnderBust?: number;
    exactWaist?: number;
    exactHips?: number;
    exactThigh?: number;
    exactCalf?: number;
    shoeSize?: number;
    shoulderWidth?: number;
}

interface ProductData {
    name: string;
    category: string;
    description?: string;
}

function translateBustType(type: string): string {
    const map: Record<string, string> = { small: 'pequeno', medium: 'médio', large: 'grande' };
    return map[type] || type;
}

function translateHipType(type: string): string {
    const map: Record<string, string> = { narrow: 'estreito', medium: 'médio', wide: 'largo' };
    return map[type] || type;
}

function buildContextPrompt(categoryName: string, m: BodyMeasurements): string {
    if (categoryName.includes('sutia') || categoryName.includes('top')) {
        return `CONTEXTO SUTIÃS E TOPS:
- Sub-Busto (Tórax): ${m.exactUnderBust ? m.exactUnderBust + 'cm' : 'Não informado'}
- Busto: ${m.exactBust ? m.exactBust + 'cm' : 'Não informado'}
- Priorize conforto da respiração se medida do tórax for limítrofe.`;
    }
    if (categoryName.includes('calcinha') || categoryName.includes('cueca')) {
        return `CONTEXTO CALCINHAS E CUECAS:
- Cintura: ${m.exactWaist ? m.exactWaist + 'cm' : 'Não informado'}
- Quadril: ${m.exactHips ? m.exactHips + 'cm' : 'Não informado'}
- Coxa: ${m.exactThigh ? m.exactThigh + 'cm' : 'Não informado'}`;
    }
    if (categoryName.includes('pijama') || categoryName.includes('camisola') || categoryName.includes('robe')) {
        return `CONTEXTO PIJAMAS: Foco na FLUIDEZ. Use a maior medida como determinante.`;
    }
    if (categoryName.includes('meia')) {
        return `CONTEXTO MEIAS:
- Nº Calçado: ${m.shoeSize || 'Não informado'}
- Panturrilha: ${m.exactCalf ? m.exactCalf + 'cm' : 'Não informado'}`;
    }
    return '';
}

function buildPrompt(
    m: BodyMeasurements,
    product: ProductData,
    categoryName: string,
    sizeGuide: unknown,
    contextPrompt: string
): string {
    return `Você é o Especialista em Fit e Modelagem da LyVest.

MISSÃO: Garantir conforto absoluto, eliminando erro de compra.

${contextPrompt}

CLIENTE:
- Altura/Peso: ${m.height}cm / ${m.weight}kg
- Busto: ${m.exactBust || 'N/A'}, Tórax: ${m.exactUnderBust || 'N/A'}
- Cintura: ${m.exactWaist || 'N/A'}, Quadril: ${m.exactHips || 'N/A'}
- Tipo: ${translateBustType(m.bustType)} / ${translateHipType(m.hipType)}
- Preferência: ${m.fitPreference === 'snug' ? 'justo' : 'confortável'}

PRODUTO: ${product.name} (${categoryName})

TABELA: ${JSON.stringify(sizeGuide, null, 2)}

Retorne APENAS JSON: {"size":"P","confidence":0.92,"reason":"...","alternativeSize":"M"}`;
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY; // Server-only, NOT NEXT_PUBLIC_

        if (!apiKey) {
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const measurements: BodyMeasurements = body.measurements;
        const product: ProductData = body.product;

        if (!measurements || !product) {
            return NextResponse.json(
                { error: 'Missing measurements or product data' },
                { status: 400 }
            );
        }

        const categoryName = typeof product.category === 'string'
            ? product.category.toLowerCase()
            : 'lingerie';

        const sizeGuide = SIZE_GUIDE[categoryName] || SIZE_GUIDE.calcinhas;

        const contextPrompt = buildContextPrompt(categoryName, measurements);
        const prompt = buildPrompt(measurements, product, categoryName, sizeGuide, contextPrompt);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Você é uma consultora de moda íntima. Sempre retorne JSON válido.' },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'AI service error' },
                { status: 502 }
            );
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const recommendation = JSON.parse(content);

        return NextResponse.json(recommendation);
    } catch (error) {
        console.error('Size AI API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
