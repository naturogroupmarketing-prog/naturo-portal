import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-shark-50 dark:bg-shark-800 rounded-lg">
                <Skeleton className="w-12 h-12 rounded shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
