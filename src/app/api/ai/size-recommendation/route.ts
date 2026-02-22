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

        // Build context prompt based on category
        let contextPrompt = '';
        if (categoryName.includes('sutia') || categoryName.includes('top')) {
            contextPrompt = `CONTEXTO SUTIÃS E TOPS:
- Sub-Busto (Tórax): ${measurements.exactUnderBust ? measurements.exactUnderBust + 'cm' : 'Não informado'}
- Busto: ${measurements.exactBust ? measurements.exactBust + 'cm' : 'Não informado'}
- Priorize conforto da respiração se medida do tórax for limítrofe.`;
        } else if (categoryName.includes('calcinha') || categoryName.includes('cueca')) {
            contextPrompt = `CONTEXTO CALCINHAS E CUECAS:
- Cintura: ${measurements.exactWaist ? measurements.exactWaist + 'cm' : 'Não informado'}
- Quadril: ${measurements.exactHips ? measurements.exactHips + 'cm' : 'Não informado'}
- Coxa: ${measurements.exactThigh ? measurements.exactThigh + 'cm' : 'Não informado'}`;
        } else if (categoryName.includes('pijama') || categoryName.includes('camisola') || categoryName.includes('robe')) {
            contextPrompt = `CONTEXTO PIJAMAS: Foco na FLUIDEZ. Use a maior medida como determinante.`;
        } else if (categoryName.includes('meia')) {
            contextPrompt = `CONTEXTO MEIAS:
- Nº Calçado: ${measurements.shoeSize || 'Não informado'}
- Panturrilha: ${measurements.exactCalf ? measurements.exactCalf + 'cm' : 'Não informado'}`;
        }

        const prompt = `Você é o Especialista em Fit e Modelagem da LyVest.

MISSÃO: Garantir conforto absoluto, eliminando erro de compra.

${contextPrompt}

CLIENTE:
- Altura/Peso: ${measurements.height}cm / ${measurements.weight}kg
- Busto: ${measurements.exactBust || 'N/A'}, Tórax: ${measurements.exactUnderBust || 'N/A'}
- Cintura: ${measurements.exactWaist || 'N/A'}, Quadril: ${measurements.exactHips || 'N/A'}
- Tipo: ${translateBustType(measurements.bustType)} / ${translateHipType(measurements.hipType)}
- Preferência: ${measurements.fitPreference === 'snug' ? 'justo' : 'confortável'}

PRODUTO: ${product.name} (${categoryName})

TABELA: ${JSON.stringify(sizeGuide, null, 2)}

Retorne APENAS JSON: {"size":"P","confidence":0.92,"reason":"...","alternativeSize":"M"}`;

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
