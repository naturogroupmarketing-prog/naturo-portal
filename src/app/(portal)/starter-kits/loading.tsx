import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title and button placeholder */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-shark-100 rounded animate-pulse" />
          <div className="h-4 w-56 bg-shark-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-shark-100 rounded-lg animate-pulse" />
      </div>

      {/* Kit cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="space-y-3">
                <div className="h-32 bg-shark-50 rounded-lg animate-pulse" />
                <div className="h-5 w-3/4 bg-shark-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-shark-50 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-shark-50 rounded animate-pulse" />
                <div className="h-9 w-full bg-shark-100 rounded-lg animate-pulse mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
