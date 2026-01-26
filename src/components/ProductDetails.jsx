import React, { useState } from 'react';
import { ShoppingBag, Play, Minus, Plus, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateSlug } from '../utils/slug';
import { productsData } from '../data/mockData';
import { useI18n } from '../hooks/useI18n';
import ProductCard from './ProductCard';

function ProductDetails({ product, onAddToCart }) {
    const navigate = useNavigate();
    const { t, isRTL, formatCurrency, getProductData } = useI18n();
    const [quantity, setQuantity] = useState(1);
    const [shippingZip, setShippingZip] = useState('');
    const [activeImage, setActiveImage] = useState(product ? product.image : '');
    const [activeTab, setActiveTab] = useState('description'); // For mobile tabs

    if (!product) return null;

    // Translated product data
    const productName = getProductData(product.id, 'name') || product.name;
    const productDescription = getProductData(product.id, 'description') || product.description;
    const _productBadge = getProductData(product.id, 'badge') || product.badge;
    const productSpecs = getProductData(product.id, 'specs') || product.specs;

    // Mock thumbnails (replicating the main image since we only have one per product in mock data)
    const thumbnails = [product.image, product.image, product.image];

    // Reference handleViewDetails removed as navigate is straightforward now if needed, but actually page view doesn't navigate to itself.

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    // --- REFERENCE PAGE LAYOUT ---
    return (
        <div className="min-h-screen bg-white animate-fade-in pb-20">
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl pt-8">

                {/* TOP SECTION: 2 COLUMNS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">

                    {/* LEFT COLUMN: VISUALS (6 Cols) */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                        {/* Desktop: thumbnails left + image right | Mobile: image + thumbnails below */}
                        <div className="flex flex-col lg:flex-row gap-4 lg:h-[450px]">
                            {/* Thumbnails - Vertical on desktop, hidden on mobile (shown below instead) */}
                            <div className="hidden lg:flex flex-col gap-3 w-20 overflow-y-auto py-1 scrollbar-hide">
                                {thumbnails.map((thumb, idx) => (
                                    <button
                                        key={idx}
                                        className={`w-20 h-20 border-2 rounded-lg cursor-pointer transition-all p-1 ${activeImage === thumb && idx === 0 ? 'border-lyvest-500' : 'border-slate-100 hover:border-lyvest-200'}`}
                                        onClick={() => setActiveImage(thumb)}
                                    >
                                        <img src={thumb} alt="thumbnail" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                                {product.video && (
                                    <button
                                        onClick={() => window.open(product.video, '_blank')}
                                        className="w-20 h-20 border-2 border-lyvest-100 bg-lyvest-100/30 rounded-lg flex flex-col items-center justify-center text-lyvest-500 hover:bg-lyvest-100 hover:border-lyvest-200 transition-colors group/video"
                                        title={t('products.watchVideo')}
                                    >
                                        <Play className="w-8 h-8 fill-current mb-1 group-hover/video:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase">Vídeo</span>
                                    </button>
                                )}
                            </div>

                            {/* Main Image */}
                            <div className="flex-1 bg-white flex items-center justify-center relative group h-[350px] lg:h-auto">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    loading="eager"
                                    className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                                />
                            </div>
                        </div>

                        {/* Thumbnails - Horizontal below image on mobile only */}
                        <div className="flex lg:hidden gap-3 overflow-x-auto py-2 scrollbar-hide justify-center">
                            {thumbnails.map((thumb, idx) => (
                                <button
                                    key={idx}
                                    className={`flex-shrink-0 w-16 h-16 border-2 rounded-lg cursor-pointer transition-all p-1 ${activeImage === thumb && idx === 0 ? 'border-lyvest-500' : 'border-slate-100 hover:border-lyvest-200'}`}
                                    onClick={() => setActiveImage(thumb)}
                                >
                                    <img src={thumb} alt="thumbnail" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                                </button>
                            ))}
                            {product.video && (
                                <button
                                    onClick={() => window.open(product.video, '_blank')}
                                    className="flex-shrink-0 w-16 h-16 border-2 border-lyvest-100 bg-lyvest-100/30 rounded-lg flex flex-col items-center justify-center text-lyvest-500 hover:bg-lyvest-100 hover:border-lyvest-200 transition-colors group/video"
                                    title={t('products.watchVideo')}
                                >
                                    <Play className="w-6 h-6 fill-current mb-1 group-hover/video:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase">Vídeo</span>
                                </button>
                            )}
                        </div>
                    </div>


                    {/* RIGHT COLUMN: INFO & BUY (7 Cols) */}
                    <div className="lg:col-span-6 flex flex-col gap-6">

                        {/* Title & Brand */}
                        <div>
                            <h1 className="text-3xl lg:text-4xl text-lyvest-600 font-normal mb-2 leading-tight">
                                {productName}
                            </h1>
                            <p className="text-slate-500 text-sm">
                                {t('products.brand')}: <span className="text-lyvest-500 font-bold">Ly Vest</span>
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                                {t('products.availability')}: <span className="text-green-600">{t('products.inStock')}</span>
                            </p>
                            <p className="text-slate-500 text-sm">
                                {t('products.warranty')}: 30 {t('products.days')}
                            </p>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        {/* Price */}
                        <div>
                            <span className="text-slate-400 line-through text-sm">de: R$ {(product.price * 1.2).toFixed(2).replace('.', ',')}</span>
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-lg text-slate-800 font-bold mb-1">{t('products.priceBy') || 'por:'}</span>
                                <span className="text-4xl font-bold text-slate-900">{formatCurrency(product.price)}</span>
                            </div>
                            <p className="text-lyvest-600 text-sm font-medium">
                                {t('products.installments', { installments: 3, amount: formatCurrency(product.price / 3) })}
                            </p>
                        </div>



                        {/* Buy Actions */}
                        <div className="flex flex-row gap-4 mt-2">
                            {/* Quantity */}
                            <div className="flex items-center bg-slate-100 rounded-md h-12">
                                <button onClick={() => handleQuantityChange(-1)} className="px-4 h-full text-slate-500 hover:text-lyvest-600 transition-colors">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center font-bold text-slate-800">{quantity}</span>
                                <button onClick={() => handleQuantityChange(1)} className="px-4 h-full text-slate-500 hover:text-lyvest-600 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Buy Button */}
                            <button
                                onClick={() => onAddToCart({ ...product, quantity })}
                                className="flex-1 bg-lyvest-600 text-white font-bold h-12 rounded-md hover:bg-lyvest-600 transition-colors shadow-md text-lg uppercase tracking-wide"
                            >
                                {t('products.buy')}
                            </button>
                        </div>

                        {/* Shipping Calculator */}
                        <div className="mt-6">
                            <h3 className="text-lyvest-600 font-bold text-sm mb-2">{t('products.shipping.title')}</h3>
                            <div className="flex gap-2 max-w-md">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={shippingZip}
                                        onChange={(e) => setShippingZip(e.target.value)}
                                        placeholder={t('products.shipping.placeholder')}
                                        className={`w-full border border-slate-300 rounded-md ${isRTL ? 'pr-4 pl-10' : 'pl-4 pr-10'} py-2.5 outline-none focus:border-lyvest-500 transition-colors text-sm`}
                                    />
                                    <Lock className={`w-4 h-4 text-green-500 absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`} />
                                </div>
                                <button className="px-6 py-2.5 border border-slate-300 text-slate-500 font-bold text-xs uppercase rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors">
                                    {t('products.shipping.calculate')}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* BOTTOM SECTION: DESCRIPTION + SPECS */}
                <div className="mt-20">
                    {/* Mobile: Tabs Navigation */}
                    <div className="lg:hidden mb-6">
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-colors ${activeTab === 'description'
                                    ? 'text-lyvest-600 border-b-2 border-lyvest-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {'Descrição'}
                            </button>
                            <button
                                onClick={() => setActiveTab('specs')}
                                className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-colors ${activeTab === 'specs'
                                    ? 'text-lyvest-600 border-b-2 border-lyvest-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {'Especificações'}
                            </button>
                        </div>

                        {/* Mobile: Tab Content */}
                        <div className="mt-6 animate-fade-in">
                            {activeTab === 'description' && (
                                <div className="space-y-4 text-slate-600 leading-relaxed">
                                    <p>{productDescription}</p>
                                    <p>{t('products.productDeveloped') || 'Este produto foi desenvolvido pensando no seu conforto íntimo, trazendo tecidos respiráveis e modelagens que valorizam o corpo sem apertar.'}</p>
                                    <p>{t('products.idealGift') || 'Ideal para renovar sua gaveta ou presentear alguém especial com a qualidade Ly Vest.'}</p>
                                </div>
                            )}
                            {activeTab === 'specs' && productSpecs && (
                                <ul className="space-y-4">
                                    {Object.entries(productSpecs).map(([key, value]) => (
                                        <li key={key} className="flex justify-between border-b border-slate-200 pb-3 last:border-0">
                                            <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">{key}</span>
                                            <span className="font-medium text-slate-800 text-right">{value}</span>
                                        </li>
                                    ))}
                                    {product.ean && (
                                        <li className="flex justify-between border-b border-slate-200 pb-3 last:border-0">
                                            <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">EAN</span>
                                            <span className="font-mono text-slate-800 text-right">{product.ean}</span>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Desktop: Unified Card with Two Columns */}
                    <div className="hidden lg:block">
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                            <div className="flex">
                                {/* LEFT: Description (White Background) */}
                                <div className="flex-1 p-10 bg-white">
                                    <h3 className="text-xl font-bold text-lyvest-600 mb-6">
                                        {t('products.aboutProduct') || 'Sobre o Produto'}
                                    </h3>
                                    <div className="space-y-4 text-slate-600 leading-relaxed">
                                        <p>{productDescription}</p>
                                        <p>{t('products.productDeveloped') || 'Este produto foi desenvolvido pensando no seu conforto íntimo, trazendo tecidos respiráveis e modelagens que valorizam o corpo sem apertar.'}</p>
                                        <p>{t('products.idealGift') || 'Ideal para renovar sua gaveta ou presentear alguém especial com a qualidade Ly Vest.'}</p>
                                    </div>
                                </div>

                                {/* RIGHT: Specs (Light Gray Background) */}
                                {productSpecs && (
                                    <div className="flex-1 p-10 bg-slate-50">
                                        <h3 className="text-xl font-bold text-lyvest-600 mb-6">
                                            {t('products.specs') || 'Especificações Técnicas'}
                                        </h3>
                                        <table className="w-full text-left border-collapse">
                                            <tbody>
                                                {Object.entries(productSpecs).map(([key, value]) => (
                                                    <tr key={key} className="border-b border-slate-200">
                                                        <th className="py-3 font-bold text-slate-500 uppercase text-xs tracking-wider w-1/3 align-middle">{key}</th>
                                                        <td className="py-3 font-medium text-slate-800 text-right align-middle">{value}</td>
                                                    </tr>
                                                ))}
                                                {product.ean && (
                                                    <tr className="border-b border-slate-200 last:border-0">
                                                        <th className="py-3 font-bold text-slate-500 uppercase text-xs tracking-wider w-1/3 align-middle">EAN</th>
                                                        <td className="py-3 font-mono text-slate-800 text-right align-middle">{product.ean}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* RELATED PRODUCTS SECTION */}
            <div className="mt-24 mb-12 border-t border-slate-100 pt-12">
                <h2 className="text-3xl font-bold text-center text-lyvest-600 mb-12">{t('products.related')}</h2>

                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {productsData
                            .filter(p => p.id !== product.id)
                            .slice(0, 4)
                            .map((relatedProduct) => (
                                <ProductCard
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                    isFavorite={false}
                                    onToggleFavorite={() => { }}
                                    onAddToCart={(qty) => onAddToCart({ ...relatedProduct, quantity: qty })}
                                    onQuickView={() => {
                                        const slug = generateSlug(relatedProduct.name);
                                        navigate(`/produto/${slug}`);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                />
                            ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
export default React.memo(ProductDetails);







