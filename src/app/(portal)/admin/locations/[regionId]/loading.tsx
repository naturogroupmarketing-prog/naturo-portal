import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="h-8 w-48 bg-shark-100 rounded animate-pulse" />
        <div className="h-4 w-64 bg-shark-100 rounded animate-pulse mt-2" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-shark-50 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-shark-100 rounded animate-pulse" />
                  <div className="h-6 w-14 bg-shark-100 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="py-4">
          <div className="h-5 w-32 bg-shark-100 rounded animate-pulse mb-4" />
          {/* Table header */}
          <div className="flex gap-4 mb-3">
            <div className="h-4 w-1/4 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-shark-100 rounded animate-pulse" />
          </div>
          {/* Table rows */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-shark-50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
