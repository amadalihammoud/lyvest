import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '../../utils/slug';
import { productsData } from '../../data/mockData';
// Removed static ProductCard import
import { useI18n } from '../../hooks/useI18n';
import { Product } from '../../services/ProductService';

// Sub-components
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import { ProductActions } from './ProductActions';
import { ProductTabs } from './ProductTabs';
import dynamic from 'next/dynamic';

// Lazy loading "Related Products" to skip loading all ProductCard definitions in the initial bundle
const RelatedProducts = dynamic(() => import('./RelatedProducts'), { ssr: false });

interface ProductDetailsProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onOpenVirtualFitting?: () => void;
}

function ProductDetails({ product, onAddToCart, onOpenVirtualFitting }: ProductDetailsProps) {
    const router = useRouter();
    const { t, isRTL, formatCurrency, getProductData } = useI18n();
    const [quantity, setQuantity] = useState(1);
    const [shippingZip, setShippingZip] = useState('');
    const [activeImage, setActiveImage] = useState(product ? product.image : '');
    const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description');

    if (!product) return null;

    // Translated product data
    const productName = (getProductData(product.id, 'name') as string) || product.name;
    const productDescription = (getProductData(product.id, 'description') as string) || product.description;
    const productSpecs = (getProductData(product.id, 'specs') as Record<string, string>) || product.specs || {};

    // Mock thumbnails (replicating the main image since we only have one per product in mock data)
    const thumbnails = [product.image, product.image, product.image];

    return (
        <div className="min-h-screen bg-white animate-fade-in pb-20">
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl pt-8">

                {/* TOP SECTION: 2 COLUMNS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">

                    {/* LEFT COLUMN: VISUALS (6 Cols) */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                        <ProductGallery
                            images={thumbnails}
                            activeImage={activeImage}
                            setActiveImage={setActiveImage}
                            video={product.video}
                            productName={productName}
                            t={t}
                        />
                    </div>

                    {/* RIGHT COLUMN: INFO & BUY (7 Cols) */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                        <ProductInfo
                            product={product}
                            productName={productName}
                            formatCurrency={formatCurrency}
                            t={t}
                        />

                        <ProductActions
                            product={product}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            onAddToCart={onAddToCart}
                            onOpenVirtualFitting={onOpenVirtualFitting}
                            shippingZip={shippingZip}
                            setShippingZip={setShippingZip}
                            t={t}
                            isRTL={isRTL}
                        />
                    </div>
                </div>

                {/* BOTTOM SECTION: DESCRIPTION + SPECS */}
                <ProductTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    productDescription={productDescription}
                    productSpecs={productSpecs}
                    ean={product.ean}
                    t={t}
                />

            </div>

            {/* RELATED PRODUCTS SECTION - LAZY LOADED */}
            <RelatedProducts
                productId={product.id}
                onAddToCart={onAddToCart}
                t={t}
            />

        </div>
    );
}
export default React.memo(ProductDetails);
