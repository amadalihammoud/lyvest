import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { chartToPromptTable, getSizeChart, normalizeCategorySlug, CategorySlug, SizeChartRow } from '@/data/sizeChart';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getProductSizeChart } from '@/services/sizeChartService';
import { logger } from '@/utils/logger';

/**
 * POST /api/ai/size-recommendation
 *
 * Recomendação de tamanho via OpenAI (chave só no servidor).
 *
 * Segurança (skill ecommerce-security):
 * - Pilar 4 (Cofre): rate limit tier 'ai' — rota consome LLM pago; sem limite, um bot
 *   em loop vira fatura de OpenAI.
 * - Pilar 5: entrada validada com Zod (safeParse) e strings saneadas antes de entrar
 *   no prompt; resposta da IA revalidada antes de devolver (só os campos esperados).
 * - A tabela de medidas usada no prompt vem do SERVIDOR (ficha do produto no Supabase
 *   ou tabela canônica por categoria) — nunca do client.
 */

const measurementsSchema = z.object({
    height: z.number().min(120).max(230),
    weight: z.number().min(30).max(250),
    age: z.number().int().min(13).max(120).optional(),
    bustType: z.enum(['small', 'medium', 'large']),
    hipType: z.enum(['narrow', 'medium', 'wide']),
    fitPreference: z.enum(['snug', 'comfortable']),
    exactBust: z.number().min(50).max(200).optional(),
    exactUnderBust: z.number().min(40).max(180).optional(),
    exactWaist: z.number().min(40).max(200).optional(),
    exactHips: z.number().min(50).max(220).optional(),
    exactThigh: z.number().min(20).max(120).optional(),
    exactCalf: z.number().min(15).max(80).optional(),
    shoeSize: z.number().min(30).max(48).optional(),
    shoulderWidth: z.number().min(25).max(70).optional(),
});

const bodySchema = z.object({
    measurements: measurementsSchema,
    product: z.object({
        id: z.union([z.string().max(64), z.number()]).optional(),
        name: z.string().min(1).max(120),
        category: z
            .union([
                z.string().max(60),
                z.object({ name: z.string().max(60).optional(), slug: z.string().max(60).optional() }),
            ])
            .optional(),
    }),
});

// Resposta da IA revalidada na saída — nunca repassar JSON de LLM sem validar.
const recommendationSchema = z.object({
    size: z.enum(['PP', 'P', 'M', 'G', 'GG']),
    confidence: z.number().min(0).max(1),
    reason: z.string().max(400),
    alternativeSize: z.enum(['PP', 'P', 'M', 'G', 'GG']).optional(),
});

type Measurements = z.infer<typeof measurementsSchema>;

// Pilar 5: validação de fronteira com Zod (nunca apenas typeof).
// Retorna null para body ausente/inválido — o handler responde 400.
async function parseBody(request: NextRequest): Promise<z.infer<typeof bodySchema> | null> {
    let json: unknown;
    try {
        json = await request.json();
    } catch {
        return null;
    }
    const parsed = bodySchema.safeParse(json);
    return parsed.success ? parsed.data : null;
}

// Remove quebras de linha/controle de strings que entram no prompt (anti prompt-injection estrutural)
function sanitizeForPrompt(s: string): string {
    // eslint-disable-next-line no-control-regex
    return s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
}

function fmtCm(v?: number): string {
    return v ? `${v}cm` : 'Não informado';
}

function buildContextPrompt(slug: CategorySlug, m: Measurements): string {
    if (slug === 'sutia') {
        return `CONTEXTO SUTIÃS E TOPS:
- Sob-Busto (Tórax): ${fmtCm(m.exactUnderBust)}
- Busto: ${fmtCm(m.exactBust)}
- A taça é a DIFERENÇA entre busto e sob-busto. Priorize conforto da respiração se a medida do tórax for limítrofe.`;
    }
    if (slug === 'calcinha' || slug === 'cueca') {
        return `CONTEXTO CALCINHAS E CUECAS:
- Cintura: ${fmtCm(m.exactWaist)}
- Quadril: ${fmtCm(m.exactHips)}
- Coxa: ${fmtCm(m.exactThigh)}`;
    }
    if (slug === 'pijama') {
        return 'CONTEXTO PIJAMAS: Foco na FLUIDEZ. Use a maior medida como determinante.';
    }
    if (slug === 'meia') {
        return `CONTEXTO MEIAS:
- Nº Calçado: ${m.shoeSize || 'Não informado'}
- Panturrilha: ${fmtCm(m.exactCalf)}`;
    }
    return '';
}

const BUST_TYPE_PT: Record<string, string> = { small: 'pequeno', medium: 'médio', large: 'grande' };
const HIP_TYPE_PT: Record<string, string> = { narrow: 'estreito', medium: 'médio', wide: 'largo' };

function buildPrompt(
    m: Measurements,
    productName: string,
    slug: CategorySlug,
    chartRows: SizeChartRow[],
    chartSource: 'produto' | 'categoria'
): string {
    return `Você é o Especialista em Fit e Modelagem da LyVest.

MISSÃO: Garantir conforto absoluto, eliminando erro de compra.

${buildContextPrompt(slug, m)}

CLIENTE:
- Altura/Peso: ${m.height}cm / ${m.weight}kg
- Busto: ${m.exactBust || 'N/A'}, Tórax: ${m.exactUnderBust || 'N/A'}
- Cintura: ${m.exactWaist || 'N/A'}, Quadril: ${m.exactHips || 'N/A'}
- Tipo: ${BUST_TYPE_PT[m.bustType]} / ${HIP_TYPE_PT[m.hipType]}
- Preferência: ${m.fitPreference === 'snug' ? 'justo' : 'confortável'}

PRODUTO: ${productName} (${slug})

TABELA DE MEDIDAS DO CORPO (fonte: ${chartSource === 'produto' ? 'ficha técnica deste produto' : 'tabela padrão da categoria'}):
${chartToPromptTable(chartRows)}

Retorne APENAS JSON: {"size":"P","confidence":0.92,"reason":"...","alternativeSize":"M"}`;
}

// Chama a OpenAI e revalida a resposta do LLM (Pilar 5 na saída: só os campos esperados
// voltam para o client). Retorna null para qualquer falha — o handler responde 502.
async function fetchAiRecommendation(
    prompt: string,
    apiKey: string
): Promise<z.infer<typeof recommendationSchema> | null> {
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

    if (!response.ok) return null;

    try {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        return recommendationSchema.parse(JSON.parse(content));
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    // Pilar 4 (Cofre): rota paga por chamada — rate limit por IP antes de qualquer trabalho.
    const ip = getClientIp(request.headers);
    const rl = await checkRateLimit(ip, 'ai');
    if (!rl.success) {
        return NextResponse.json(
            { error: 'Muitas tentativas. Aguarde um instante e tente de novo.' },
            { status: 429 }
        );
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY; // Server-only, NOT NEXT_PUBLIC_

        if (!apiKey) {
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 503 }
            );
        }

        const parsed = await parseBody(request);
        if (!parsed) {
            return NextResponse.json(
                { error: 'Invalid measurements or product data' },
                { status: 400 }
            );
        }

        const { measurements, product } = parsed;
        const slug = normalizeCategorySlug(product.category ?? product.name);
        const productName = sanitizeForPrompt(product.name);

        // Tabela de medidas decidida no SERVIDOR: ficha do produto (Supabase) > categoria canônica
        const productChart = product.id !== undefined
            ? await getProductSizeChart(String(product.id))
            : null;
        const chartRows = productChart ?? getSizeChart(product.category ?? product.name).rows;
        const chartSource = productChart ? 'produto' : 'categoria';

        const prompt = buildPrompt(measurements, productName, slug, chartRows, chartSource);

        const recommendation = await fetchAiRecommendation(prompt, apiKey);
        if (!recommendation) {
            return NextResponse.json({ error: 'AI service error' }, { status: 502 });
        }

        return NextResponse.json(recommendation);
    } catch (error) {
        // Sem vazamento de error.message/stack para o client
        logger.error('Size AI API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
