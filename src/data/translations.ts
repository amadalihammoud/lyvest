import { ptBR } from './locales/pt-BR';

/**
 * Traduções da aplicação
 * Estrutura: translations[locale][section][key]
 *
 * pt-BR é carregado estaticamente (locale padrão — sempre necessário).
 * en-US e es-ES são carregados dinamicamente ao trocar idioma,
 * mantendo-os fora do bundle inicial para reduzir o JS parsed na home.
 */
export const defaultTranslations = ptBR;

export type TranslationData = typeof ptBR;

/**
 * Carrega um locale dinamicamente.
 * Retorna ptBR como fallback se o locale não for reconhecido.
 */
export async function loadLocale(locale: string): Promise<TranslationData> {
    switch (locale) {
        case 'en-US':
            return import('./locales/en-US').then((m) => m.enUS);
        case 'es-ES':
            return import('./locales/es-ES').then((m) => m.esES);
        case 'pt-BR':
        default:
            return ptBR;
    }
}
