/**
 * Leitura server-side de financial_configs (fonte da verdade no banco) com cache
 * em memória e fallback para as constantes locais.
 *
 * Regra: o banco manda; a constante SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD vira
 * apenas fallback para dev sem banco e para falhas transitórias de leitura.
 */

import { eq } from 'drizzle-orm';

import { SHIPPING_CONFIG } from '../config/constants';
import { financialConfigs } from '../db/schema';
import { logError } from '../lib/server/logger';

import { db, isDbConfigured } from './dbClient';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

let cachedThreshold: { value: number; at: number } | null = null;

/** Valor mínimo para frete grátis (financial_configs.free_shipping_threshold). */
export async function getFreeShippingThreshold(): Promise<number> {
    const fallback = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;

    if (!isDbConfigured()) return fallback;

    if (cachedThreshold && Date.now() - cachedThreshold.at < CACHE_TTL_MS) {
        return cachedThreshold.value;
    }

    try {
        const rows = await db
            .select({ ruleValue: financialConfigs.ruleValue })
            .from(financialConfigs)
            .where(eq(financialConfigs.ruleKey, 'free_shipping_threshold'))
            .limit(1);

        const value = Number(rows[0]?.ruleValue);
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
