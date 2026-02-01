import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in">
            {/* Image Placeholder */}
            <Skeleton className="w-full aspect-[4/5] relative" />

            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* Category & Badge */}
                <div className="flex justify-between items-start">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                </div>

                {/* Rating */}
                <Skeleton className="h-4 w-24 mt-1" />

                <div className="h-px bg-slate-100 my-2" />

                {/* Price & Actions */}
                <div className="mt-auto flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>
        </div>
    );
}
