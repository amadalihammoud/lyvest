
/**
 * Gera um slug URL-friendly a partir de um texto.
 * Remove acentos, caracteres especiais e converte para minúsculas.
 * 
 * @param text - O texto a ser convertido.
 * @returns O slug gerado.
 */
export const generateSlug = (text: string): string =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
