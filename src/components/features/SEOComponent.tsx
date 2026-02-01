
import { Helmet } from 'react-helmet-async';

const DOMAIN = 'https://lyvest.vercel.app';

interface AdditionalProperty {
    "@type": string;
    name: string;
    value: string;
}

interface ProductColor {
    name: string;
    hex?: string;
}

interface Product {
    id: string | number;
    name: string;
    description?: string;
    image: string | string[];
    price: number;
    rating?: number;
    reviews?: number;
    ean?: string;
    category?: string | { name: string; slug: string; } | { name: string; slug: string; }[] | any; // Allow complex category
    slug?: string;
    colors?: ProductColor[] | any[]; // Allow loose structure for compatibility
    specs?: Record<string, string | number | undefined>; // Match Service
    [key: string]: any;
}

interface BreadcrumbItem {
    label: string;
    link?: string;
}

interface FAQItem {
    question: string;
    answer: string;
}

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product' | 'category';
    product?: Product | Product[] | null;
    breadcrumbs?: BreadcrumbItem[];
    faq?: FAQItem[];
    fullTitle?: boolean;
}

export default function SEO({
    title,
    description,
    image,
    url,
    type = 'website',
    product,
    breadcrumbs = [],
    faq = [],
    fullTitle = false
}: SEOProps) {
    const metaTitle = fullTitle ? title : `${title} | Ly Vest`;
    const metaDescription = description || "Ly Vest - Moda feminina com estilo e elegância. Vestidos, blusas, saias e muito mais.";
    const metaImage = image ? (image.startsWith('http') ? image : `${DOMAIN}${image}`) : `${DOMAIN}/og-default.jpg`;
    const metaUrl = url ? (url.startsWith('http') ? url : `${DOMAIN}${url}`) : DOMAIN;

    // --- Schema Generators ---

    const generateOrganizationSchema = () => ({
        "@type": "Organization",
        "name": "Ly Vest",
        "url": DOMAIN,
        "logo": `${DOMAIN}/logo.png`,
        "sameAs": [
            "https://www.instagram.com/lyvest",
            "https://www.facebook.com/lyvest"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+55-13-99624-6969",
            "contactType": "customer service",
            "areaServed": "BR",
            "availableLanguage": "Portuguese"
        }
    });

    const generateBreadcrumbSchema = () => {
        if (!breadcrumbs || breadcrumbs.length === 0) return null;
        return {
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.label,
                "item": item.link ? (item.link.startsWith('http') ? item.link : `${DOMAIN}${item.link}`) : undefined
            }))
        };
    };

    const generateProductSchema = (prod: Product) => {
        if (!prod) return null;

        // Construct additional properties from specs
        const additionalProperty: AdditionalProperty[] = prod.specs ? Object.entries(prod.specs).map(([key, value]) => ({
            "@type": "PropertyValue",
            "name": key,
            "value": String(value) // Convert to string for schema
        })) : [];

        // Add Color/Material logic if available
        if (prod.colors && prod.colors.length > 0) {
            additionalProperty.push({
                "@type": "PropertyValue",
                "name": "availableColors",
                "value": prod.colors.map(c => c.name).join(", ")
            });
        }

        return {
            "@type": "Product",
            "name": prod.name,
            "image": Array.isArray(prod.image) ? prod.image : [prod.image],
            "description": prod.description,
            "sku": prod.id ? `SKU-${prod.id}` : undefined,
            "gtin": prod.ean || undefined,
            "brand": {
                "@type": "Brand",
                "name": "Ly Vest"
            },
            "category": prod.category,
            "additionalProperty": additionalProperty,
            "offers": {
                "@type": "Offer",
                "url": metaUrl,
                "priceCurrency": "BRL",
                "price": prod.price.toFixed(2),
                "itemCondition": "https://schema.org/NewCondition",
                "availability": "https://schema.org/InStock",
                "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": {
                        "@type": "MonetaryAmount",
                        "value": 0,
                        "currency": "BRL"
                    },
                    "deliveryTime": {
                        "@type": "ShippingDeliveryTime",
                        "handlingTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 0,
                            "maxValue": 1,
                            "unitCode": "DAY"
                        },
                        "transitTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 1,
                            "maxValue": 5,
                            "unitCode": "DAY"
                        }
                    }
                },
                "hasMerchantReturnPolicy": {
                    "@type": "MerchantReturnPolicy",
                    "applicableCountry": "BR",
                    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                    "merchantReturnDays": 30,
                    "returnMethod": "https://schema.org/ReturnByMail",
                    "returnFees": "https://schema.org/FreeReturn"
                }
            },
            // Aggregate Rating (safe check)
            ...(prod.rating && {
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": prod.rating,
                    "reviewCount": prod.reviews || 1
                }
            })
        };
    };

    const generateFAQSchema = (faqs: FAQItem[]) => {
        if (!faqs || faqs.length === 0) return null;
        return {
            "@type": "FAQPage",
            "mainEntity": faqs.map(faqItem => ({
                "@type": "Question",
                "name": faqItem.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faqItem.answer
                }
            }))
        };
    };


    const generateCollectionPageSchema = (prods: Product[]) => {
        if (!prods || prods.length === 0) return null;
        return {
            "@type": "CollectionPage",
            "name": metaTitle,
            "url": metaUrl,
            "description": metaDescription,
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": prods.slice(0, 10).map((prod, index) => ({ // First 10 items for brevity
                    "@type": "ListItem",
                    "position": index + 1,
                    "url": `${DOMAIN}/produto/${prod.slug || prod.id}` // Assuming slug generation might be needed if not present
                }))
            }
        };
    };

    // --- Context & Graph Construction ---
    const graph: any[] = [
        generateOrganizationSchema(),
        {
            "@type": "WebSite",
            "url": DOMAIN,
            "name": "Ly Vest",
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${DOMAIN}/busca?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        }
    ];

    const breadcrumbSchema = generateBreadcrumbSchema();
    if (breadcrumbSchema) graph.push(breadcrumbSchema);

    if (type === 'product' && product && !Array.isArray(product)) {
        const productSchema = generateProductSchema(product as Product);
        if (productSchema) graph.push(productSchema);
    } else if (type === 'category' && product && Array.isArray(product)) {
        // 'product' prop is reused here to pass the list of products for category pages
        const collectionSchema = generateCollectionPageSchema(product as Product[]);
        if (collectionSchema) graph.push(collectionSchema);
    }

    const faqSchema = generateFAQSchema(faq);
    if (faqSchema) graph.push(faqSchema);


    return (
        <Helmet>
            {/* Standard SEO */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={metaUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:site_name" content="Ly Vest" />
            <meta property="og:locale" content="pt_BR" />

            {/* Product Specific OG */}
            {type === 'product' && product && !Array.isArray(product) && (
                <>
                    <meta property="product:price:amount" content={(product as Product).price.toFixed(2)} />
                    <meta property="product:price:currency" content="BRL" />
                    <meta property="product:brand" content="Ly Vest" />
                    <meta property="product:category" content={(product as Product).category} />
                    {(product as Product).colors && (product as Product).colors?.map((color: ProductColor) => (
                        <meta property="product:color" content={color.name} key={color.name} />
                    ))}
                </>
            )}

            {/* Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />

            {/* JSON-LD Schema */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@graph": graph
                })}
            </script>
        </Helmet>
    );
}
