
import CategoryPageClient from '@/components/pages/CategoryPageClient';
import { productsData } from '@/data/products';
import { generateSlug } from '@/utils/slug';

export const dynamicParams = true; // or false if we want strict paths

// Intentionally skipping generateStaticParams to allow Dynamic Rendering (SSR) 
// avoiding layout conflicts with the Suspense dynamic header.

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <CategoryPageClient slug={slug} />;
}
