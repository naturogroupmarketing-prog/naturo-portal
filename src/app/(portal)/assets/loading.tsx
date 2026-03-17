import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-shark-100 rounded animate-pulse" />
          <div className="h-4 w-48 bg-shark-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-shark-100 rounded-lg animate-pulse" />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-64 bg-shark-50 rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-shark-50 rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-shark-50 rounded-lg animate-pulse" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="py-0">
          {/* Table header */}
          <div className="flex items-center gap-4 py-3 border-b border-shark-100">
            <div className="h-4 w-24 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-28 bg-shark-100 rounded animate-pulse flex-1" />
            <div className="h-4 w-16 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-shark-100 rounded animate-pulse" />
          </div>
          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-shark-50 last:border-0">
              <div className="h-5 w-24 bg-shark-50 rounded animate-pulse" />
              <div className="h-5 w-20 bg-shark-50 rounded animate-pulse" />
              <div className="h-5 w-40 bg-shark-50 rounded animate-pulse flex-1" />
              <div className="h-5 w-16 bg-shark-50 rounded-full animate-pulse" />
              <div className="h-5 w-20 bg-shark-50 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
