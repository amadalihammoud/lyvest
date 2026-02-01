import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ProductDetails from '../components/product/ProductDetails';
import { useCart } from '../hooks/useCart';
import { useModal } from '../hooks/useModal';
import SEO from '../components/features/SEOComponent';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductDetailsSkeleton from '../components/product/ProductDetailsSkeleton';
import { productsData } from '../data/mockData';
import { generateSlug } from '../utils/slug';
import { Product } from '../services/ProductService';
import VirtualFitting from '../components/features/VirtualFitting';

export default function ProductPage() {
    const { slug } = useParams();
    const { addToCart } = useCart();
    const { openModal } = useModal();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVirtualFittingOpen, setIsVirtualFittingOpen] = useState(false);

    useEffect(() => {
        async function loadProduct() {
            if (!slug) return;
            setLoading(true);

            // 1. Try to find by slug in Supabase
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
            const mockProduct = productsData.find(p => generateSlug(p.name) === slug);

            if (mockProduct) {
                setProduct(mockProduct);
                setLoading(false);
                return;
            }

            // 3. Not found
            console.error('Product not found in Supabase or Mock Data:', error);
            setLoading(false);
            // Don't auto-redirect to 404 here to avoid flickering if it's just slow, 
            // but if loading is done and no product, we render 404 or redirect.
        }

        loadProduct();
    }, [slug]);

    const handleAddToCart = (item: any) => {
        addToCart(item);
        openModal('addedToCart', item);
    };

    const handleSizeSelected = () => {
        if (product) {
            // Adicionar produto ao carrinho quando selecionado via IA
            addToCart(product as any);
            openModal('addedToCart', product);
        }
    };

    if (loading) {
        return <ProductDetailsSkeleton />;
    }

    if (!product) {
        // Redirect or show not found
        // navigate('/404', { replace: true });
        // return null;
        return <div className="text-center p-20">Produto não encontrado.</div>;
    }

    const getCategoryName = (p: Product) => {
        if (typeof p.category === 'string') return p.category;
        if (Array.isArray(p.category)) return p.category[0]?.name || 'Departamento';
        return p.category?.name || 'Departamento';
    };

    const getCategorySlug = (p: Product) => {
        if (typeof p.category === 'string') return p.category; // Or slugify string
        if (Array.isArray(p.category)) return p.category[0]?.slug || 'todos';
        return p.category?.slug || 'todos';
    };

    const breadcrumbItems = [
        { label: getCategoryName(product), link: `/categoria/${getCategorySlug(product)}` },
        { label: product.name }
    ];

    return (
        <>
            <SEO
                title={product.name}
                description={product.description}
                image={Array.isArray(product.image) ? product.image[0] : product.image}
                product={product}
                type="product"
                breadcrumbs={breadcrumbItems}
            />
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
