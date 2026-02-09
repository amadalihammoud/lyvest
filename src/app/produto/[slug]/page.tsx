
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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <ProductPageClient slug={slug} />;
}
