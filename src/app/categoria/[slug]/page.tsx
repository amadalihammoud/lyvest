import type { Metadata } from 'next';

import CategoryPageClient from '@/components/pages/CategoryPageClient';
import { getCategories, getProducts } from '@/server/providers/catalog';

export const dynamicParams = true; // or false if we want strict paths

// Ver comentário em src/app/page.tsx: estratégia de renderização declarada.
export const revalidate = 300;

// Intentionally skipping generateStaticParams to allow Dynamic Rendering (SSR)
// avoiding layout conflicts with the Suspense dynamic header.

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://lyvest.com.br';

/**
 * Sem isto, o Next aplicava o metadata padrão de src/app/layout.tsx a TODAS as
 * categorias: /categoria/calcinhas, /categoria/sutias e /categoria/pijamas
 * compartilhavam o mesmo title e a mesma description. Título duplicado em massa
 * faz o Google reescrever o título por conta própria e tende a tratar as páginas
 * como conteúdo de baixo valor.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const categoria = (await getCategories()).find((c) => c.slug === slug);

    if (!categoria) {
        return { title: 'Categoria não encontrada | Ly Vest' };
    }

    const title = `${categoria.name} | Ly Vest`;
    const description = `Veja a seleção de ${categoria.name.toLowerCase()} da Ly Vest: conforto, caimento e acabamento premium. Entrega para todo o Brasil.`;

    return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/categoria/${slug}` },
        openGraph: { title, description, url: `${SITE_URL}/categoria/${slug}`, type: 'website' },
    };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Catálogo buscado NO SERVIDOR e entregue já no HTML.
    //
    // Antes esta página tinha 12 linhas e só repassava o slug: os produtos
    // chegavam depois da hidratação, via useCatalogStore → fetch('/api/products').
    // O HTML servido ao Googlebot continha o bloco de estado vazio e nenhum
    // <a href="/produto/...">, ou seja, a vitrine era invisível para busca — e o
    // LCP do conteúdo comercial dependia de um round-trip sem cache.
    // Erro propaga — ver comentário em src/app/page.tsx: com ISR, capturar aqui
    // trocaria uma falha auto-recuperável por cache envenenado com página vazia.
    const initialProducts = await getProducts({ categorySlug: slug });

    return <CategoryPageClient slug={slug} initialProducts={initialProducts} />;
}
