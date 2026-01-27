
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate slug (simple version matching utils/slug.js)
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

// We need to read mockData but since it's a JSX file with imports, 
// we'll use a regex approach to extract data to avoid babel/transpilation complexity in this simple script
// or we can just duplicate the data for this MVP script if parsing is too complex.
// BETTER APPROACH: Let's read the file content and extract the array using regex to be safe and simple.

const mockDataPath = path.join(__dirname, '../src/data/mockData.jsx');
const publicPath = path.join(__dirname, '../public/sitemap.xml');
const DOMAIN = 'https://lyvest.vercel.app';

try {
    const fileContent = fs.readFileSync(mockDataPath, 'utf8');

    // 1. Extract Products
    // This regex looks for: export const productsData = [...];
    const productsMatch = fileContent.match(/export const productsData = \[\s*([\s\S]*?)\];/);

    // 2. Extract Categories
    // We'll extract categories from the products themselves to match the site structure

    if (!productsMatch) {
        throw new Error("Could not find productsData in mockData.jsx");
    }

    // Rough parsing of the JS array string to objects
    // We need to clean up the string to make it valid JSON-ish or just parse manually
    // Since we only need names and categories, we can use regex to find them.

    const productEntries = [];
    const categories = new Set();

    // Regex to find name and category in the file content directly
    const nameRegex = /name:\s*"([^"]+)"/g;
    const categoryRegex = /category:\s*"([^"]+)"/g;

    let match;
    const items = [];

    // We'll split the content by objects to keep name/category paired
    const objectStrings = productsMatch[1].split('},');

    objectStrings.forEach(str => {
        const nameMatch = /name:\s*"([^"]+)"/.exec(str);
        const catMatch = /category:\s*"([^"]+)"/.exec(str);

        if (nameMatch && catMatch) {
            const name = nameMatch[1];
            const category = catMatch[1];

            items.push({ name, category });
            categories.add(category);
        }
    });

    console.log(`Found ${items.length} products and ${categories.size} categories.`);

    // --- Generate XML ---
    const lastMod = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home -->
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Categories
    categories.forEach(cat => {
        const slug = generateSlug(cat);
        xml += `  <url>
    <loc>${DOMAIN}/categoria/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // Products
    items.forEach(item => {
        const slug = generateSlug(item.name);
        xml += `  <url>
    <loc>${DOMAIN}/produto/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    fs.writeFileSync(publicPath, xml);
    console.log(`Sitemap generated successfully at ${publicPath}`);

} catch (error) {
    console.error("Error generating sitemap:", error);
    process.exit(1);
}
