/**
 * Leitura server-side de financial_configs (fonte da verdade no banco) com cache
 * em memória e fallback para as constantes locais.
 *
 * Regra: o banco manda; a constante SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD vira
 * apenas fallback para dev sem Supabase e para falhas transitórias de leitura.
 */

import { SHIPPING_CONFIG } from '../config/constants';
import { logError } from '../lib/server/logger';

import { supabase, isSupabaseConfigured } from './supabase';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

let cachedThreshold: { value: number; at: number } | null = null;

/** Valor mínimo para frete grátis (financial_configs.free_shipping_threshold). */
export async function getFreeShippingThreshold(): Promise<number> {
    const fallback = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;

    if (!isSupabaseConfigured()) return fallback;

    if (cachedThreshold && Date.now() - cachedThreshold.at < CACHE_TTL_MS) {
        return cachedThreshold.value;
    }

    try {
        const { data, error } = await supabase
            .from('financial_configs')
            .select('rule_value')
            .eq('rule_key', 'free_shipping_threshold')
            .maybeSingle();

        if (error) {
            logError('financialConfig: erro ao ler free_shipping_threshold', error);
            return cachedThreshold?.value ?? fallback;
        }

        const value = Number(data?.rule_value);
        if (!Number.isFinite(value) || value <= 0) {
            return cachedThreshold?.value ?? fallback;
        }

        cachedThreshold = { value, at: Date.now() };
        return value;
    } catch (e) {
        logError('financialConfig: exceção ao ler config', e);
        return cachedThreshold?.value ?? fallback;
    }
}
