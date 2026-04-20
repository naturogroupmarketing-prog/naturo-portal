import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title and subtitle */}
      <div>
        <div className="h-8 w-36 bg-shark-100 dark:bg-shark-800 rounded animate-pulse" />
        <div className="h-4 w-72 bg-shark-100 dark:bg-shark-800 rounded animate-pulse mt-2" />
      </div>

      {/* Return items card */}
      <Card>
        <CardContent className="py-4">
          <div className="h-5 w-32 bg-shark-100 dark:bg-shark-800 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-shark-50 rounded-lg animate-pulse">
                <div className="w-12 h-12 rounded bg-shark-100 dark:bg-shark-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-shark-100 dark:bg-shark-800 rounded" />
                  <div className="h-3 w-1/3 bg-shark-100 dark:bg-shark-800 rounded" />
                </div>
                <div className="h-8 w-20 bg-shark-100 dark:bg-shark-800 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
