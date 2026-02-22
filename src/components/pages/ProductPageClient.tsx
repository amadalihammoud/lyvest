
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import VirtualFitting from '@/components/features/VirtualFitting';
import ProductDetails from '@/components/product/ProductDetails';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useCart , CartItem } from '@/context/CartContext';
import { useModal } from '@/context/ModalContext';
import { Product } from '@/services/ProductService';
import { generateSlug } from '@/utils/slug';

interface ProductPageClientProps {
    slug: string;
    initialProduct: Product | null;
}

export default function ProductPageClient({ slug, initialProduct }: ProductPageClientProps) {
    const { addToCart } = useCart();
    const { openModal } = useModal();
    // We rely on initialProduct passed from server. 
    // If we wanted to re-validate, we could, but for optimization we trust server.
    const product = initialProduct;

    const [isVirtualFittingOpen, setIsVirtualFittingOpen] = useState(false);
    const router = useRouter();

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

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 animate-fade-in">
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
        { label: getCategoryName(product), link: `/categoria/${generateSlug(getCategoryName(product))}` },
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
