
import type { Metadata } from 'next';
import ProductPageClient from '@/components/pages/ProductPageClient';
import { productsData } from '@/data/mockData';
import { generateSlug } from '@/utils/slug';

export const dynamicParams = true;

// Pre-generate some popular products for speed
export async function generateStaticParams() {
    return productsData.slice(0, 10).map(p => ({
        slug: generateSlug(p.name),
    }));
}

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


import { supabase } from '@/lib/supabase';
import { Product } from '@/services/ProductService';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // 1. Try to find by slug in Supabase
    let product: Product | null = null;

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, category:categories(name, slug)')
            .eq('slug', slug)
            .single();

        if (data) {
            product = {
                ...data,
                image: data.image_url || (data as any).image || '',
                // Ensure category matches Product type which expects object or string
                category: data.category
            } as unknown as Product;
        }
    } catch (err) {
        console.error('Error fetching product from Supabase:', err);
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
