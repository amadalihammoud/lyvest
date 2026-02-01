/**
 * Componente de skeleton loading para cards de produto
 * Melhora a UX durante carregamento mostrando placeholder animado
 */
export default function ProductSkeleton(): React.ReactElement {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
            {/* Image Skeleton */}
            <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-100" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Badge Skeleton */}
                <div className="h-5 w-20 bg-slate-200 rounded-full" />

                {/* Title Skeleton */}
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>

                {/* Price Skeleton */}
                <div className="flex items-center gap-2 pt-2">
                    <div className="h-6 w-20 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>

                {/* Button Skeleton */}
                <div className="h-10 bg-slate-200 rounded-full mt-4" />
            </div>
        </div>
    );
}

interface ProductSkeletonGridProps {
    count?: number;
}

/**
 * Grid de skeletons para múltiplos produtos
 */
export function ProductSkeletonGrid({ count = 4 }: ProductSkeletonGridProps): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {Array.from({ length: count }, (_, i) => (
                <ProductSkeleton key={i} />
            ))}
        </div>
    );
}
