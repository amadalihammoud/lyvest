// src/pages/ProductPage.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductDetails from '../components/product/ProductDetails';
import { productsData } from '../data/mockData';
import { useCart } from '../hooks/useCart';
import { useModal } from '../hooks/useModal';
import SEO from '../components/features/SEOComponent';
import { generateSlug } from '../utils/slug';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { openModal } = useModal();
    const product = productsData.find((p) => generateSlug(p.name) === slug);

    const handleAddToCart = (item) => {
        addToCart(item);
        openModal('addedToCart', item);
    };

    useEffect(() => {
        if (!product) {
            navigate('/404', { replace: true });
        }
    }, [product, navigate]);

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-lyvest-100 border-t-[#800020] rounded-full animate-spin" />
            </div>
        );
    }

    const breadcrumbItems = [
        { label: product.category, link: `/categoria/${generateSlug(product.category)}` },
        { label: product.name }
    ];

    return (
        <>
            <SEO
                title={product.name}
                description={product.description}
                image={product.image}
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
                        onClose={() => navigate('/')}
                        onAddToCart={handleAddToCart}
                        isModal={false}
                    />
                </div>
            </div>
        </>
    );
}








