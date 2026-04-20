import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="h-8 w-44 bg-shark-100 dark:bg-shark-800 rounded animate-pulse" />
        <div className="h-4 w-52 bg-shark-100 dark:bg-shark-800 rounded animate-pulse mt-2" />
      </div>

      {/* Notification items */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-shark-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 rounded-full bg-shark-100 dark:bg-shark-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-shark-100 dark:bg-shark-800 rounded" />
                  <div className="h-3 w-full bg-shark-100 dark:bg-shark-800 rounded" />
                  <div className="h-3 w-24 bg-shark-100 dark:bg-shark-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
