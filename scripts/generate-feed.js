/*
 * Script para gerar XML de produtos para Google Shopping / Facebook Ads
 *
 * Como usar:
 * 1. Configure as variáveis de ambiente em .env.local
 * 2. Execute: node scripts/generate-feed.js
 * 3. O arquivo será salvo em public/products.xml
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

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para escapar caracteres XML
const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};

async function generateFeed() {
    console.log('🔄 Buscando produtos no Supabase...');

    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);

    if (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.warn('⚠️ Nenhum produto encontrado. Verifique se há produtos ativos no banco.');
        // Gerar XML vazio ou com produtos de exemplo se necessário
    }

    console.log(`✅ Encontrados ${products.length} produtos.`);

    // Cabeçalho do XML (RSS 2.0 + Google Merchant Center Namespace)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
    <title>Ly Vest - Moda Íntima</title>
    <link>${SITE_URL}</link>
    <description>Lingerie confortável e elegante para o seu dia a dia.</description>
`;

    // Adicionar produtos
    products.forEach(product => {
        // Fallback para dados obrigatórios do Google
        const title = escapeXml(product.name || 'Produto Ly Vest');
        const description = escapeXml(product.description || product.name || 'Lingerie de alta qualidade.');
        const price = product.price ? `${product.price.toFixed(2)} BRL` : '0.00 BRL';
        const image = product.image || `${SITE_URL}/placeholder.jpg`;
        const link = `${SITE_URL}/produto/${product.slug || product.id}`;
        
        // Categorização básica (Google Taxonomy ID 213 = Apparel & Accessories > Clothing > Underwear & Socks > Lingerie)
        // Você pode melhorar isso mapeando suas categorias do banco
        const googleCategory = '213'; 

        xml += `
    <item>
        <g:id>${product.id}</g:id>
        <g:title>${title}</g:title>
        <g:description>${description}</g:description>
        <g:link>${link}</g:link>
        <g:image_link>${image}</g:image_link>
        <g:brand>Ly Vest</g:brand>
        <g:condition>new</g:condition>
        <g:availability>${product.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
        <g:price>${price}</g:price>
        <g:google_product_category>${googleCategory}</g:google_product_category>
        <g:custom_label_0>${product.category_id || 'Geral'}</g:custom_label_0>
    </item>`;
    });

    // Fechar XML
    xml += `
</channel>
</rss>`;

    // Salvar arquivo
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const publicDir = path.resolve(__dirname, '../public');
    const filePath = path.join(publicDir, 'products.xml');

    try {
        fs.writeFileSync(filePath, xml);
        console.log(`🚀 Feed XML gerado com sucesso em: ${filePath}`);
        console.log(`🔗 URL Pública: ${SITE_URL}/products.xml`);
    } catch (err) {
        console.error('❌ Erro ao salvar arquivo:', err);
    }
}

generateFeed();
