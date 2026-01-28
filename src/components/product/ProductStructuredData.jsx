// src/components/ProductStructuredData.jsx
import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

// Pre-calculate price valid date at module load (not during render)
const PRICE_VALID_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

/**
 * Componente que adiciona dados estruturados JSON-LD para produtos
 * Melhora SEO e permite rich snippets no Google
 * 
 * @param {{ product: object }} props
 */
export default function ProductStructuredData({ product }) {
    const structuredData = useMemo(() => {
        if (!product) return null;

        return {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.image ? [window.location.origin + product.image] : [],
            brand: {
                '@type': 'Brand',
                name: 'Ly Vest'
            },
            offers: {
                '@type': 'Offer',
                url: window.location.href,
                priceCurrency: 'BRL',
                price: product.price,
                priceValidUntil: PRICE_VALID_DATE,
                availability: product.inStock !== false
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                seller: {
                    '@type': 'Organization',
                    name: 'Ly Vest'
                }
            },
            // Adiciona categoria se disponível
            ...(product.category && {
                category: product.category
            }),
            // Adiciona rating agregado (valores de exemplo para demonstração)
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '127'
            }
        };
    }, [product]);

    if (!structuredData) return null;

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
}

/**
 * Dados estruturados para a organização (empresa)
 * Use no layout principal ou página inicial
 */
export function OrganizationStructuredData() {
    const orgData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Ly Vest',
        url: window.location.origin,
        logo: window.location.origin + '/header-logo.png',
        description: 'Moda feminina com estilo e elegância. Vestidos, blusas, saias e muito mais.',
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+55-11-99999-0000',
            contactType: 'customer service',
            availableLanguage: ['Portuguese', 'English', 'Spanish']
        },
        sameAs: [
            'https://www.instagram.com/lyvest',
            'https://www.facebook.com/lyvest'
        ]
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(orgData)}
            </script>
        </Helmet>
    );
}

/**
 * Dados estruturados de BreadcrumbList para navegação
 * @param {{ items: Array<{ name: string, url: string }> }} props
 */
export function BreadcrumbStructuredData({ items }) {
    if (!items || items.length === 0) return null;

    const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbData)}
            </script>
        </Helmet>
    );
}







