/*
 * Ficha técnica de medidas POR PRODUTO (tabela `size_charts` no Supabase).
 *
 * Fluxo de dados: fabricante/fornecedor → cadastro (manual ou sync do ERP) →
 * `size_charts` → provador/guia. Enquanto um produto não tem ficha própria,
 * os consumidores caem na tabela canônica por categoria (src/data/sizeChart.ts).
 *
 * Leitura é pública (Vitrine — RLS permite SELECT); escrita só via service_role
 * (admin/integração ERP), nunca pelo client.
 */

import { SizeChartRow, SizeLabel, SIZE_ORDER } from '../data/sizeChart';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logger } from '../utils/logger';

interface SizeChartDbRow {
    size: string;
    bust_min: number | null;
    bust_max: number | null;
    underbust_min: number | null;
    underbust_max: number | null;
    waist_min: number | null;
    waist_max: number | null;
    hip_min: number | null;
    hip_max: number | null;
    bra_number: string | null;
}

function toRange(min: number | null, max: number | null) {
    return min !== null && max !== null ? { min: Number(min), max: Number(max) } : undefined;
}

/**
 * Busca a ficha técnica de medidas de um produto.
 * Retorna null se o produto não tem ficha cadastrada (usar fallback por categoria).
 */
export async function getProductSizeChart(productId: string): Promise<SizeChartRow[] | null> {
    if (!isSupabaseConfigured() || !productId) return null;

    try {
        const { data, error } = await supabase
            .from('size_charts')
            .select('size, bust_min, bust_max, underbust_min, underbust_max, waist_min, waist_max, hip_min, hip_max, bra_number')
            .eq('product_id', productId);

        if (error) throw error;
        if (!data || data.length === 0) return null;

        const rows = (data as SizeChartDbRow[])
            .filter((row): row is SizeChartDbRow & { size: SizeLabel } =>
                (SIZE_ORDER as readonly string[]).includes(row.size))
            .map((row) => ({
                size: row.size as SizeLabel,
                bust: toRange(row.bust_min, row.bust_max),
                underbust: toRange(row.underbust_min, row.underbust_max),
                waist: toRange(row.waist_min, row.waist_max),
                hip: toRange(row.hip_min, row.hip_max),
                braNumber: row.bra_number ?? undefined,
            }))
            .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

        return rows.length > 0 ? rows : null;
    } catch (error) {
        logger.error('sizeChartService: erro ao buscar ficha do produto', error);
        return null; // fail-open para o fallback por categoria
    }
}
