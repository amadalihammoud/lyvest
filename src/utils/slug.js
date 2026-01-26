/**
 * Gera um slug URL-friendly a partir de um texto.
 * Remove acentos, caracteres especiais e converte para minúsculas.
 * 
 * @param {string} text - O texto a ser convertido.
 * @returns {string} O slug gerado.
 */
export const generateSlug = (text) =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');







