
import CategoryPageClient from '@/components/pages/CategoryPageClient';
import { productsData } from '@/data/products';
import { generateSlug } from '@/utils/slug';

export const dynamicParams = true; // or false if we want strict paths

export async function generateStaticParams() {
    // Generate paths for all categories found in productsData
    const categories = new Set(productsData.map(p => p.category));
    return Array.from(categories).map(cat => ({
        slug: generateSlug(cat),
    }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <CategoryPageClient slug={slug} />;
}
