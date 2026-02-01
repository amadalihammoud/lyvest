import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Full page skeleton loader for route transitions
 */
const PageLoader: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 animate-fade-in">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-slate-200 h-20 w-full flex items-center px-4 md:px-8 justify-between">
                <div className="flex items-center gap-8">
                    <Skeleton className="h-8 w-8 md:hidden" />
                    <Skeleton className="h-8 w-32" />
                    <div className="hidden md:flex gap-6">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-64 hidden md:block rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>

            {/* Content Skeleton (Hero-ish) */}
            <div className="container mx-auto px-4 py-8 space-y-8">
                <div className="w-full h-[60vh] md:h-[500px] rounded-3xl overflow-hidden relative">
                    <Skeleton className="absolute inset-0 w-full h-full" />
                    <div className="absolute inset-x-0 bottom-0 p-8 space-y-4">
                        <Skeleton className="h-10 w-1/2 bg-white/20" />
                        <Skeleton className="h-4 w-1/3 bg-white/20" />
                        <Skeleton className="h-12 w-40 rounded-full bg-white/20" />
                    </div>
                </div>

                {/* Product Grid Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
                    <Skeleton className="aspect-[4/5] rounded-2xl" />
                    <Skeleton className="aspect-[4/5] rounded-2xl" />
                    <Skeleton className="aspect-[4/5] rounded-2xl" />
                    <Skeleton className="aspect-[4/5] rounded-2xl" />
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
