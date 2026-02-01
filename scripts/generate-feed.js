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
const SITE_URL = process.env.SITE_URL || 'https://lyvest.vercel.app';

// Supabase é opcional - usaremos dados mockados se não estiver configurado
const USE_SUPABASE = !!(supabaseUrl && supabaseKey);

if (!USE_SUPABASE) {
    console.warn('⚠️  Supabase não configurado. Usando dados mockados para feed.');
}

const supabase = USE_SUPABASE ? createClient(supabaseUrl, supabaseKey) : null;

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
    return unsafe;
};

async function generateFeed() {
    console.log('🔄 Gerando Product Feed XML...');

    let products = [];

    if (USE_SUPABASE) {
        console.log('📡 Buscando produtos do Supabase...');
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true);

        if (error) {
            console.error('❌ Erro ao buscar produtos:', error);
            console.warn('⚠️  Usando dados mockados como fallback...');
        } else {
            products = data || [];
        }
    }

    // Se não tem Supabase ou deu erro, usar dados mockados
    if (!USE_SUPABASE || products.length === 0) {
        console.log('📦 Usando dados mockados...');
        products = [
            {
                id: 1,
                name: 'Calcinha Renda Francesa',
                description: 'Calcinha de renda francesa delicada',
                price: 89.90,
                image_url: `${SITE_URL}/images/products/calcinha-1.jpg`,
                category: 'calcinhas',
                brand: 'Ly Vest',
                availability: 'in stock'
            },
            {
                id: 2,
                name: 'Conjunto Noite Estrelada',
                description: 'Conjunto elegante com detalhes em renda',
                price: 149.90,
                image_url: `${SITE_URL}/images/products/conjunto-1.jpg`,
                category: 'conjuntos',
                brand: 'Ly Vest',
                availability: 'in stock'
            },
            {
                id: 3,
                name: 'Sutã Elite Collection',
                description: 'Sutã premium com suporte especial',
                price: 119.90,
                image_url: `${SITE_URL}/images/products/sutia-1.jpg`,
                category: 'sutias',
                brand: 'Ly Vest',
                availability: 'in stock'
            },
        ];
    }

    if (products.length === 0) {
        console.error('❌ Nenhum produto encontrado! Verifique se há produtos ativos no banco.');
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

        // Determinar disponibilidade (prioriza campo explícito, depois estoque)
        let availability = 'out of stock';
        if (product.availability) {
            availability = product.availability;
        } else if ((product.stock_quantity && product.stock_quantity > 0) || (product.stock && product.stock > 0)) {
            availability = 'in stock';
        }

        xml += `
    <item>
        <g:id>${product.id}</g:id>
        <g:title>${title}</g:title>
        <g:description>${description}</g:description>
        <g:link>${link}</g:link>
        <g:image_link>${image}</g:image_link>
        <g:brand>Ly Vest</g:brand>
        <g:condition>new</g:condition>
        <g:availability>${availability}</g:availability>
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
