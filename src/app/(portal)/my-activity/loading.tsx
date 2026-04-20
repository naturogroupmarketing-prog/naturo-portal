import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="h-8 w-40 bg-shark-100 dark:bg-shark-800 rounded animate-pulse" />
        <div className="h-4 w-56 bg-shark-100 dark:bg-shark-800 rounded animate-pulse mt-2" />
      </div>

      {/* Activity items */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-shark-50 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-shark-100 dark:bg-shark-800 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-shark-50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
