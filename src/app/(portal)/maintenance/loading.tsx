import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="h-8 w-44 bg-shark-100 rounded animate-pulse" />
        <div className="h-4 w-60 bg-shark-100 rounded animate-pulse mt-2" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="py-4">
          {/* Table header */}
          <div className="flex gap-4 mb-3">
            <div className="h-4 w-1/5 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-1/5 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-1/5 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-1/5 bg-shark-100 rounded animate-pulse" />
            <div className="h-4 w-1/5 bg-shark-100 rounded animate-pulse" />
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
