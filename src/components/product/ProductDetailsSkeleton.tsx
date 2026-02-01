import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductDetailsSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Gallery Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="w-full aspect-[3/4] rounded-3xl" />
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="aspect-square rounded-xl" />
                    </div>
                </div>

                {/* Info Skeleton */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                    </div>

                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <div className="flex gap-4">
                            <Skeleton className="h-12 flex-1 rounded-full" />
                            <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-8 border-t border-slate-100">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
        </div>
    );
}
