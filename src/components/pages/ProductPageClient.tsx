
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProductDetails from '@/components/product/ProductDetails';
import { useCart } from '@/context/CartContext';
import { useModal } from '@/context/ModalContext';

import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ProductDetailsSkeleton from '@/components/product/ProductDetailsSkeleton';
import { productsData } from '@/data/mockData';
import { generateSlug } from '@/utils/slug';
import { CartItem } from '@/context/CartContext';
import { Product } from '@/services/ProductService';
import VirtualFitting from '@/components/features/VirtualFitting';

interface ProductPageClientProps {
    slug: string;
}

export default function ProductPageClient({ slug }: ProductPageClientProps) {
    const { addToCart } = useCart();
    const { openModal } = useModal();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVirtualFittingOpen, setIsVirtualFittingOpen] = useState(false);
    const router = useRouter(); // For potential redirect

    useEffect(() => {
        async function loadProduct() {
            if (!slug) return;
            setLoading(true);

            // 1. Try to find by slug in Supabase
            // Note: Ensure supabase client is configured for client-side usage if RLS allows public access
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('slug', slug)
                .single();

            if (data) {
                setProduct(data);
                setLoading(false);
                return;
            }

            // 2. Fallback: Try to find by name (slugified) in mockData
            // Logic: Compare generated slug of mock product with the URL slug
            const mockProduct = productsData.find(p => generateSlug(p.name) === slug);

            if (mockProduct) {
                setProduct(mockProduct as unknown as Product); // Cast if mockData types slightly differ
                setLoading(false);
                return;
            }

            // 3. Not found
            console.error('Product not found in Supabase or Mock Data:', error);
            setLoading(false);
        }

        loadProduct();
    }, [slug]);

    const getCategoryName = (p: Product) => {
        if (typeof p.category === 'string') return p.category;
        if (Array.isArray(p.category)) return p.category[0]?.name || 'Departamento';
        return p.category?.name || 'Departamento';
    };

    const mapProductToCartItem = (p: Product): Partial<CartItem> => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: Array.isArray(p.image) ? p.image[0] : p.image,
        category: getCategoryName(p),
        qty: 1
    });

    const handleAddToCart = (item: any) => {
        addToCart(item);
        openModal('addedToCart', item);
    };

    const handleSizeSelected = () => {
        if (product) {
            const cartItem = mapProductToCartItem(product);
            addToCart(cartItem);
            openModal('addedToCart', product);
        }
    };

    if (loading) {
        return <ProductDetailsSkeleton />;
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Produto não encontrado</h2>
                <p className="text-slate-600 mb-6">Desculpe, não conseguimos encontrar o produto que você está procurando.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-lyvest-500 text-white rounded-full hover:bg-lyvest-600 transition-colors"
                >
                    Voltar para a Loja
                </button>
            </div>
        );
    }

    const breadcrumbItems = [
        { label: getCategoryName(product), link: `/categoria/${generateSlug(getCategoryName(product))}` }, // Ensure link uses generated slug
        { label: product.name }
    ];

    return (
        <>

            <div className="min-h-screen bg-white md:bg-slate-50 animate-fade-in relative z-10 w-full">
                <div className="container mx-auto px-4 py-2 md:py-3">
                    <Breadcrumbs
                        items={breadcrumbItems}
                    />
                </div>
                <div className="w-full">
                    <ProductDetails
                        product={product}
                        onAddToCart={handleAddToCart}
                        onOpenVirtualFitting={() => setIsVirtualFittingOpen(true)}
                    />
                </div>

                {/* Provador Virtual com IA */}
                <VirtualFitting
                    isOpen={isVirtualFittingOpen}
                    onClose={() => setIsVirtualFittingOpen(false)}
                    product={product}
                    onSizeSelected={handleSizeSelected}
                />
            </div>
        </>
    );
}
