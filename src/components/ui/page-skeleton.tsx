/**
 * PageSkeleton — standardised shimmer-animated page loading state.
 *
 * Replaces the static animate-pulse divs that were used across 10+
 * loading.tsx files. Uses the <Skeleton> shimmer primitive so loading
 * states look polished and consistent across light/dark modes.
 */

import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  /** Show the 4-column stat card row. Default: true. */
  showStats?: boolean;
  /** Number of stat cards. Default: 4. */
  statCount?: number;
  /** Stat grid column layout class. Default: "grid-cols-2 lg:grid-cols-4". */
  statCols?: string;
  /** Height of the main content area. Default: "h-64". */
  contentHeight?: string;
  /** Show a second content block. Default: false. */
  twoContent?: boolean;
  /** Max-width wrapper (e.g. "max-w-2xl"). */
  maxWidth?: string;
}

export function PageSkeleton({
  showStats = true,
  statCount = 4,
  statCols = "grid-cols-2 lg:grid-cols-4",
  contentHeight = "h-64",
  twoContent = false,
  maxWidth,
}: PageSkeletonProps) {
  return (
    <div className={`space-y-6 ${maxWidth ?? ""}`}>
      {/* Page heading */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stat cards */}
      {showStats && (
        <div className={`grid ${statCols} gap-4`}>
          {Array.from({ length: statCount }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      )}

      {/* Main content area */}
      <Skeleton className={`${contentHeight} w-full rounded-xl`} />

      {/* Optional second content block */}
      {twoContent && <Skeleton className="h-48 w-full rounded-xl" />}
    </div>
  );
}

/** For pages with a single large form card (company settings, profile). */
export function FormPageSkeleton({ maxWidth = "max-w-2xl" }: { maxWidth?: string }) {
  return (
    <div className={`${maxWidth} space-y-6`}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

/** For backup/download pages: summary card + 2-col grid. */
export function BackupPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
