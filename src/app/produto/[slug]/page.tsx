
import type { Metadata } from 'next';

import ProductPageClient from '@/components/pages/ProductPageClient';
import { productsData } from '@/data/products';
import { eq } from 'drizzle-orm';

import { categories, products } from '@/db/schema';
import { db, isDbConfigured } from '@/server/dbClient';
import { Product } from '@/services/ProductService';
import { generateSlug } from '@/utils/slug';

export const dynamicParams = true;

// Intentionally skipping generateStaticParams to allow Dynamic Rendering (SSR) 
// avoiding layout conflicts with the Suspense dynamic header.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = productsData.find(p => generateSlug(p.name) === slug);

    if (!product) {
        return {
            title: 'Produto não encontrado | Ly Vest',
        };
    }

    const title = `${product.name} | Ly Vest`;
    const description = product.description || `Compre ${product.name} na Ly Vest. Qualidade e conforto garantidos.`;
    const images = product.image ? [product.image.startsWith('http') ? product.image : `https://lyvest.vercel.app${product.image}`] : [];

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            type: 'article', // 'product' type is not standard in Next.js Metadata type yet, using article or website
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // 1. Try to find by slug no banco (server component → Drizzle direto, sem rota)
    let product: Product | null = null;

    if (isDbConfigured()) {
        try {
            const rows = await db
                .select({
                    id: products.id,
                    name: products.name,
                    description: products.description,
                    price: products.price,
                    promotionalPrice: products.promotionalPrice,
                    imageUrl: products.imageUrl,
                    active: products.active,
                    stock: products.stock,
                    sizes: products.sizes,
                    categoryName: categories.name,
                    categorySlug: categories.slug,
                })
                .from(products)
                .leftJoin(categories, eq(products.categoryId, categories.id))
                .where(eq(products.slug, slug))
                .limit(1);

            const row = rows[0];
            if (row) {
                product = {
                    id: row.id,
                    name: row.name,
                    description: row.description ?? '',
                    price: Number(row.promotionalPrice ?? row.price),
                    oldPrice: row.promotionalPrice ? Number(row.price) : undefined,
                    image: row.imageUrl || '',
                    active: row.active ?? true,
                    stock_quantity: row.stock ?? 0,
                    sizes: row.sizes ?? undefined,
                    category: row.categoryName
                        ? { name: row.categoryName, slug: row.categorySlug ?? '' }
                        : undefined,
                } as Product;
            }
        } catch (err) {
            console.error('Error fetching product from database:', err);
        }
    }

    // 2. Fallback: Try to find by name (slugified) in mockData
    if (!product) {
        const mockProduct = productsData.find(p => generateSlug(p.name) === slug);
        if (mockProduct) {
            product = mockProduct as unknown as Product;
        }
    }

    // 3. Not found - could return 404 or let Client handle "Product not found"
    // We pass null to client if not found, let it render the "Not Found" state

    return <ProductPageClient slug={slug} initialProduct={product} />;
}
