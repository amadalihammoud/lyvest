/*
 * Script para gerar Sitemap XML dinâmico
 *
 * Busca produtos e categorias do Supabase para manter o Google atualizado.
 * Execute: node scripts/generate-sitemap.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://lyvest.vercel.app'; // URL final de produção

// Supabase é opcional - usaremos dados mockados se não estiver configurado
const USE_SUPABASE = !!(supabaseUrl && supabaseKey);

if (!USE_SUPABASE) {
    console.warn('⚠️  Supabase não configurado. Usando dados mockados para sitemap.');
}

const supabase = USE_SUPABASE ? createClient(supabaseUrl, supabaseKey) : null;

// Helper para gerar slug (caso não venha do banco)
const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

async function generateSitemap() {
    console.log('🔄 Gerando Sitemap.xml...');

    let products = [];
    let categories = new Set();

    if (USE_SUPABASE) {
        // Buscar do Supabase
        console.log('📡 Buscando dados do Supabase...');
        const { data, error } = await supabase
            .from('products')
            .select('id, name, slug, updated_at, category_id')
            .eq('active', true);

        if (error) {
            console.error('❌ Erro ao buscar produtos:', error);
            console.warn('⚠️  Usando dados mockados como fallback...');
            // Continuar com mock data como fallback
        } else {
            products = data || [];
            products.forEach(p => {
                if (p.category_id) categories.add(p.category_id);
            });
        }
    }

    // Se não tem Supabase ou deu erro, usar dados mockados
    if (!USE_SUPABASE || products.length === 0) {
        console.log('📦 Usando dados mockados...');
        products = [
            { id: 1, name: 'Calcinha Renda Francesa', slug: 'calcinha-renda-francesa', category_id: 'calcinhas' },
            { id: 2, name: 'Conjunto Noite Estrelada', slug: 'conjunto-noite-estrelada', category_id: 'conjuntos' },
            { id: 3, name: 'Sutã Elite Collection', slug: 'sutia-elite-collection', category_id: 'sutias' },
        ];
        categories = new Set(['calcinhas', 'conjuntos', 'sutias', 'bodysuits']);
    }

    console.log(`✅ ${products.length} produtos e ${categories.size} categorias para sitemap.`);

    const lastMod = new Date().toISOString().split('T')[0];

    // Cabeçalho
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Adicionar Categorias
    categories.forEach(cat => {
        // Se a categoria for um ID numérico, isso vai gerar um link quebrado se o front esperar slug
        // Ideal: Ter tabela de categorias com slug. Fallback: Slugify o que tiver.
        const slug = generateSlug(cat);
        xml += `  <url>
    <loc>${SITE_URL}/categoria/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // Adicionar Produtos
    products.forEach(product => {
        const slug = product.slug || generateSlug(product.name);
        const date = product.updated_at ? product.updated_at.split('T')[0] : lastMod;

        xml += `  <url>
    <loc>${SITE_URL}/produto/${slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    // Salvar arquivo
    const __filename = fileURLToPath(import.meta.url); // Re-declare inside if needed or use from top
    const __dirname = path.dirname(__filename);
    const publicPath = path.resolve(__dirname, '../public/sitemap.xml');

    try {
        fs.writeFileSync(publicPath, xml);
        console.log(`🚀 Sitemap gerado com sucesso em: ${publicPath}`);
        console.log(`🔗 URL Pública: ${SITE_URL}/sitemap.xml`);
    } catch (err) {
        console.error('❌ Erro ao salvar sitemap:', err);
    }
}

generateSitemap();
