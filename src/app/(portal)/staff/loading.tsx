import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-44 bg-shark-100 rounded animate-pulse" />
          <div className="h-4 w-40 bg-shark-100 rounded animate-pulse mt-2" />
        </div>
      </div>

      {/* Search / filters */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-64 bg-shark-50 rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-shark-50 rounded-lg animate-pulse" />
      </div>

      {/* Staff cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-shark-100 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-shark-100 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-shark-50 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 mt-3 pt-3 border-t border-shark-50">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-shark-50 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-shark-50 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-shark-50 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-shark-50 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
