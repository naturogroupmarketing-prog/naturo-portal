import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-60" />
      </div>
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 mb-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-1/5" />
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
