import { cn } from "@/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/50", className)}
            {...props}
        />
    );
}

// Utility to create multiple skeletons
export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className={className} />
            ))}
        </>
    );
}
