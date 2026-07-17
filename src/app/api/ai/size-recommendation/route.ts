import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { SIZE_GUIDE } from '@/data/sizeGuide';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';

/**
 * Server-side API Route for OpenAI size recommendations.
 * This keeps the OpenAI API key secure (never sent to the browser).
 *
 * Pilar 4: rate limit (tier 'ai') — a rota chama a OpenAI e tem custo por request;
 * sem limite, vira um vetor de esgotamento de orçamento (financial DoS).
 * Pilar 5: validação de entrada com Zod (limites numéricos sãos evitam prompts absurdos).
 */

// Faixas plausíveis para medidas corporais (cm/kg) — barram valores absurdos/abusivos.
const cm = z.number().finite().min(0).max(300);
const measurementsSchema = z.object({
    height: z.number().finite().min(50).max(260),
    weight: z.number().finite().min(20).max(400),
    age: z.number().int().min(0).max(120).optional(),
    bustType: z.enum(['small', 'medium', 'large']),
    hipType: z.enum(['narrow', 'medium', 'wide']),
    fitPreference: z.enum(['snug', 'comfortable']),
    exactBust: cm.optional(),
    exactUnderBust: cm.optional(),
    exactWaist: cm.optional(),
    exactHips: cm.optional(),
    exactThigh: cm.optional(),
    exactCalf: cm.optional(),
    shoeSize: z.number().finite().min(10).max(60).optional(),
    shoulderWidth: cm.optional(),
});

const productSchema = z.object({
    name: z.string().min(1).max(200),
    category: z.string().min(1).max(100),
    description: z.string().max(2000).optional(),
});

const bodySchema = z.object({
    measurements: measurementsSchema,
    product: productSchema,
});

type BodyMeasurements = z.infer<typeof measurementsSchema>;
type ProductData = z.infer<typeof productSchema>;

function translateBustType(type: string): string {
    const map: Record<string, string> = { small: 'pequeno', medium: 'médio', large: 'grande' };
    return map[type] || type;
}

function translateHipType(type: string): string {
    const map: Record<string, string> = { narrow: 'estreito', medium: 'médio', wide: 'largo' };
    return map[type] || type;
}

function matchesAny(s: string, keywords: string[]): boolean {
    return keywords.some((k) => s.includes(k));
}
function fmtCm(v?: number): string {
    return v ? v + 'cm' : 'Não informado';
}

function buildContextPrompt(categoryName: string, m: BodyMeasurements): string {
    if (matchesAny(categoryName, ['sutia', 'top'])) {
        return `CONTEXTO SUTIÃS E TOPS:
- Sub-Busto (Tórax): ${fmtCm(m.exactUnderBust)}
- Busto: ${fmtCm(m.exactBust)}
- Priorize conforto da respiração se medida do tórax for limítrofe.`;
    }
    if (matchesAny(categoryName, ['calcinha', 'cueca'])) {
        return `CONTEXTO CALCINHAS E CUECAS:
- Cintura: ${fmtCm(m.exactWaist)}
- Quadril: ${fmtCm(m.exactHips)}
- Coxa: ${fmtCm(m.exactThigh)}`;
    }
    if (matchesAny(categoryName, ['pijama', 'camisola', 'robe'])) {
        return `CONTEXTO PIJAMAS: Foco na FLUIDEZ. Use a maior medida como determinante.`;
    }
    if (matchesAny(categoryName, ['meia'])) {
        return `CONTEXTO MEIAS:
- Nº Calçado: ${m.shoeSize || 'Não informado'}
- Panturrilha: ${fmtCm(m.exactCalf)}`;
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
    // Pilar 4 (Cofre): rota com custo por request — rate limit antes de qualquer trabalho.
    const rl = await checkRateLimit(getClientIp(request.headers), 'ai');
    if (!rl.success) {
        return NextResponse.json(
            { error: 'Muitas requisições. Tente novamente em instantes.' },
            { status: 429 }
        );
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY; // Server-only, NOT NEXT_PUBLIC_

        if (!apiKey) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
        }

        // Pilar 5: validação de entrada com Zod (nunca confiar no corpo cru).
        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }
        const measurements: BodyMeasurements = parsed.data.measurements;
        const product: ProductData = parsed.data.product;

        const categoryName = product.category.toLowerCase();

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
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            return NextResponse.json({ error: 'AI service error' }, { status: 502 });
        }
        const recommendation = JSON.parse(content);

        return NextResponse.json(recommendation);
    } catch (error) {
        logError('size-recommendation: erro inesperado', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
