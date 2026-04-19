import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex gap-4 mb-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-1/4" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
