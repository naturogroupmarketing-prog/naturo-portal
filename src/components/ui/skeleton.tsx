import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-shark-100 dark:bg-shark-800",
        "after:absolute after:inset-0 after:translate-x-[-100%]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
        "after:animate-[shimmer_1.5s_infinite]",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-[28px] border border-shark-100 dark:border-shark-800 p-5 space-y-3 bg-white dark:bg-shark-900">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-[28px] border border-shark-100 dark:border-shark-800 p-5 bg-white dark:bg-shark-900 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
