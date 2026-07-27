import type { Metadata } from 'next';

import ProductPageClient from '@/components/pages/ProductPageClient';
import { getProductBySlug } from '@/server/providers/catalog';
import { Product } from '@/services/ProductService';

export const dynamicParams = true;

// Intentionally skipping generateStaticParams to allow Dynamic Rendering (SSR)
// avoiding layout conflicts with the Suspense dynamic header.

/**
 * Domínio canônico da loja.
 *
 * NÃO usa NEXT_PUBLIC_APP_URL. Essa variável descreve "onde este deploy está
 * rodando" — em produção ela estava apontando para uma URL de preview de branch
 * (lyvest-git-...vercel.app), e isso vazou para o canonical, o og:url e a
 * offer.url do JSON-LD. Canonical apontando para outro domínio diz ao Google
 * que a página verdadeira mora lá, e pode desindexar o domínio real.
 *
 * Endereço canônico é decisão de negócio, não de ambiente: fica fixo, e só muda
 * se a loja mudar de domínio.
 */
const SITE_URL = 'https://www.lyvest.com.br';

function absoluteUrl(path: string): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;

    // MESMA função usada pelo componente abaixo. Antes, isto consultava o mock
    // `productsData` (8 itens hardcoded) enquanto o corpo da página consultava o
    // Neon — então TODO produto real do catálogo era servido com
    // <title>Produto não encontrado</title>, sem description e sem og:image.
    // O `cache()` em getProductBySlug faz as duas chamadas virarem um round-trip.
    const product = await getProductBySlug(slug);

    if (!product) {
        return { title: 'Produto não encontrado' };
    }

    // Sem sufixo aqui: o layout raiz já aplica `template: '%s | Ly Vest'`
    // (src/app/layout.tsx:38). Repetir gerava "Produto | Ly Vest | Ly Vest".
    const title = product.name;
    const description =
        product.description || `Compre ${product.name} na Ly Vest. Qualidade e conforto garantidos.`;
    const images = product.image ? [absoluteUrl(product.image)] : [];

    return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/produto/${slug}` },
        openGraph: {
            title,
            description,
            images,
            url: `${SITE_URL}/produto/${slug}`,
            type: 'article', // o Metadata do Next ainda não tipa 'product'
        },
        twitter: { card: 'summary_large_image', title, description, images },
    };
}

/**
 * JSON-LD Product/Offer/AggregateRating.
 *
 * A página já carrega no servidor tudo que o schema exige — nome, imagem,
 * preço, estoque e rating agregado — e antes jogava fora: não havia um único
 * bloco ld+json no projeto inteiro. Sem ele não há estrelas nem preço na SERP,
 * e não há elegibilidade a Google Shopping.
 */
function productJsonLd(product: Product, slug: string) {
    const disponivel = (product.stock_quantity ?? 0) > 0;

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || undefined,
        image: product.image ? [absoluteUrl(product.image)] : undefined,
        sku: String(product.id),
        gtin13: product.ean || undefined,
        brand: { '@type': 'Brand', name: 'Ly Vest' },
        offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/produto/${slug}`,
            priceCurrency: 'BRL',
            price: product.price.toFixed(2),
            availability: disponivel
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
        },
        // Só emite AggregateRating quando há avaliação de verdade: publicar
        // rating vazio ou zerado é motivo de penalização manual no Google.
        aggregateRating:
            product.rating && product.reviews
                ? {
                      '@type': 'AggregateRating',
                      ratingValue: Number(product.rating).toFixed(1),
                      reviewCount: product.reviews,
                  }
                : undefined,
    };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    return (
        <>
            {product && (
                // dangerouslySetInnerHTML aqui é o caminho padrão para JSON-LD.
                // O conteúdo é JSON.stringify de dado do próprio banco — não há
                // entrada de usuário, e a serialização escapa o que precisa.
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, slug)) }}
                />
            )}
            <ProductPageClient slug={slug} initialProduct={product} />
        </>
    );
}
