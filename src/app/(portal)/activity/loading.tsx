import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="h-8 w-44 bg-shark-100 rounded animate-pulse" />
        <div className="h-4 w-56 bg-shark-100 rounded animate-pulse mt-2" />
      </div>

      {/* Timeline groups */}
      {[...Array(3)].map((_, groupIdx) => (
        <div key={groupIdx}>
          {/* Date label */}
          <div className="h-3 w-48 bg-shark-100 rounded animate-pulse mb-3 ml-1" />
          <Card>
            <div className="divide-y divide-shark-50">
              {[...Array(groupIdx === 0 ? 4 : 3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-shark-50 animate-pulse flex-shrink-0 mt-0.5" />
                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-3/4 bg-shark-50 rounded animate-pulse" />
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-24 bg-shark-50 rounded animate-pulse" />
                      <div className="h-3 w-12 bg-shark-50 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-shark-50 rounded animate-pulse" />
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="h-5 w-24 bg-shark-50 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
