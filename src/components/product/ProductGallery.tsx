
import { Play } from 'lucide-react';

interface ProductGalleryProps {
    images: string[];
    activeImage: string;
    setActiveImage: (image: string) => void;
    video?: string;
    productName: string;
    t: (key: string) => string;
}

export function ProductGallery({ images, activeImage, setActiveImage, video, productName, t }: ProductGalleryProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:h-[450px]">
            {/* Thumbnails - Vertical on desktop, hidden on mobile */}
            <div className="hidden lg:flex flex-col gap-3 w-20 overflow-y-auto py-1 scrollbar-hide">
                {images.map((thumb, idx) => (
                    <button
                        key={idx}
                        className={`w-20 h-20 border-2 rounded-lg cursor-pointer transition-all p-1 ${activeImage === thumb && idx === 0 ? 'border-lyvest-500' : 'border-slate-100 hover:border-lyvest-200'}`}
                        onClick={() => setActiveImage(thumb)}
                    >
                        <img src={thumb} alt="thumbnail" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                    </button>
                ))}
                {video && (
                    <button
                        onClick={() => window.open(video, '_blank')}
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
                    src={activeImage}
                    alt={productName}
                    loading="eager"
                    className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                />
            </div>

            {/* Thumbnails - Horizontal below image on mobile only */}
            <div className="flex lg:hidden gap-3 overflow-x-auto py-2 scrollbar-hide justify-center w-full lg:w-auto">
                {images.map((thumb, idx) => (
                    <button
                        key={idx}
                        className={`flex-shrink-0 w-16 h-16 border-2 rounded-lg cursor-pointer transition-all p-1 ${activeImage === thumb && idx === 0 ? 'border-lyvest-500' : 'border-slate-100 hover:border-lyvest-200'}`}
                        onClick={() => setActiveImage(thumb)}
                    >
                        <img src={thumb} alt="thumbnail" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                    </button>
                ))}
            </div>
        </div>
    );
}
