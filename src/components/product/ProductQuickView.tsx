import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '../../utils/slug';
import { useI18n } from '../../hooks/useI18n';
import { useModal } from '../../hooks/useModal';
import OptimizedProductImage from '../ui/OptimizedProductImage';

import { Product } from '../../services/ProductService';

interface ProductQuickViewProps {
    product: Product | null;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
}

interface Slide {
    type: 'image' | 'video';
    src: string;
    thumb?: string;
}

function ProductQuickView({ product, onClose, onAddToCart }: ProductQuickViewProps) {
    const router = useRouter();
    const { t, formatCurrency, getProductData } = useI18n();
    const { openModal } = useModal();

    const [currentSlide, setCurrentSlide] = React.useState(0);

    // Reset slide when product changes
    React.useEffect(() => {
        setCurrentSlide(0);
    }, [product]);

    if (!product) return null;

    // Translated product data
    const productName = product ? (getProductData(product.id, 'name') as string) || product.name : '';
    const productDescription = product ? (getProductData(product.id, 'description') as string) || product.description : '';
    const productBadge = product ? (getProductData(product.id, 'badge') as string) || product.badge : '';

    // Construct Carousel Slides (Mocking multiple images + Video)
    const slides: Slide[] = product ? [
        { type: 'image', src: product.image },
        { type: 'image', src: product.image }, // Mock duplicate 1
        { type: 'image', src: product.image }, // Mock duplicate 2
    ] : [];

    if (product?.video) {
        slides.push({ type: 'video', src: product.video, thumb: product.image });
    }

    const nextSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const handleViewDetails = () => {
        if (!product) return;
        const slug = generateSlug(product.name);
        if (onClose) onClose();
        router.push(`/produto/${slug}`);
    };

    return (
        <div
            className="bg-white w-full flex flex-col md:flex-row md:rounded-3xl h-full md:h-auto md:max-h-[85vh] max-w-5xl overflow-hidden shadow-none md:shadow-2xl relative animate-scale-up"
            role="dialog"
            aria-modal="true"
        >
            {/* Carousel Section */}
            <div className="md:w-1/2 bg-slate-100 relative group order-first md:order-last flex flex-col">

                {/* Main Media Display */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    {slides[currentSlide].type === 'video' ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/5">
                            <img src={slides[currentSlide].thumb} alt="Video Thumbnail" className="max-h-full max-w-full object-contain opacity-50" />
                            <button
                                onClick={() => window.open(slides[currentSlide].src, '_blank')}
                                className="absolute inset-0 flex items-center justify-center z-10 group/play"
                            >
                                <div className="w-16 h-16 bg-lyvest-500 rounded-full flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
                                    <ShoppingBag className="w-0 h-0 hidden" /> {/* Dummy import fix if needed, using Play from lucide typically */}
                                    <svg className="w-8 h-8 text-white fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </button>
                            <span className="absolute bottom-10 font-bold text-slate-500 uppercase tracking-widest text-sm">Assistir VÃ­deo</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-[50vh] md:h-[60vh]">
                            <OptimizedProductImage
                                src={slides[currentSlide].src}
                                alt={`${productName} view ${currentSlide + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-contain transition-transform duration-500"
                                fallbackText={productName.split(' ')[0]}
                            />
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {slides.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 z-30"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 z-30"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnails / Dots */}
                <div className="h-16 flex items-center justify-center gap-2 pb-4">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-lyvest-500 w-6' : 'bg-slate-300 hover:bg-lyvest-500/50'}`}
                        />
                    ))}
                </div>


            </div>

            {/* Content Section - Scrollable */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col gap-4 overflow-y-auto">
                {/* Content Header */}

                <div>
                    {productBadge && (
                        <span className="inline-block px-3 py-1 bg-lyvest-500 text-white text-[10px] font-bold rounded-full mb-2 shadow-sm">
                            {productBadge}
                        </span>
                    )}
                    <h1 className="text-xl font-bold text-slate-800 leading-tight">
                        {productName}
                    </h1>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed line-clamp-4">
                    {productDescription}
                </p>

                <div className="flex items-center justify-between pt-2 gap-3 mt-auto border-t border-slate-100 pt-4">
                    <div className="text-2xl font-bold text-slate-800">
                        {formatCurrency(product.price)}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleViewDetails}
                            className="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-colors text-xs"
                        >
                            {t('products.viewDetails')}
                        </button>
                        <button
                            onClick={() => {
                                onAddToCart(product);
                                openModal('addedToCart', product);
                            }}
                            className="px-4 py-2 bg-lyvest-500 text-white font-bold rounded-full hover:brightness-90 transition-all shadow-lg flex items-center gap-2 text-xs"
                        >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{t('products.buy')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default React.memo(ProductQuickView);








