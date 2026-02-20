'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { productsData } from '@/data/products';
import { Product } from '@/services/ProductService';
import { generateSlug } from '@/utils/slug';

interface RelatedProductsProps {
    productId: string | number;
    onAddToCart: (product: Product) => void;
    t: (key: string) => string;
}

export default function RelatedProducts({ productId, onAddToCart, t }: RelatedProductsProps) {
    const router = useRouter();

    return (
        <div className="mt-24 mb-12 border-t border-slate-100 pt-12">
            <h2 className="text-3xl font-bold text-center text-lyvest-600 mb-12">{t('products.related')}</h2>

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {productsData
                        .filter(p => p.id !== productId)
                        .slice(0, 4)
                        .map((relatedProduct) => (
                            <ProductCard
                                key={relatedProduct.id}
                                product={relatedProduct as Product}
                                isFavorite={false}
                                onToggleFavorite={() => { }}
                                onAddToCart={(qty: number) => onAddToCart({ ...relatedProduct, quantity: qty } as Product)}
                                onQuickView={() => {
                                    const slug = generateSlug(relatedProduct.name);
                                    router.push(`/produto/${slug}`);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
}
