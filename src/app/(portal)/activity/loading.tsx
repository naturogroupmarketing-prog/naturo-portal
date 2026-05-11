import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Timeline groups */}
      {[...Array(3)].map((_, groupIdx) => (
        <div key={groupIdx}>
          <Skeleton className="h-3 w-48 mb-3 ml-1" />
          <Card>
            <div className="divide-y divide-shark-50 dark:divide-shark-800">
              {[...Array(groupIdx === 0 ? 4 : 3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
