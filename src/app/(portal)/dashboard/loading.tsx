import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="h-8 w-40 bg-shark-100 rounded animate-pulse" />
        <div className="h-4 w-52 bg-shark-100 rounded animate-pulse mt-2" />
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="border-l-4 border-l-shark-100">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-shark-50 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-shark-100 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-shark-100 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links and low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="py-4">
            <div className="h-5 w-28 bg-shark-100 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-shark-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="h-5 w-36 bg-shark-100 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-shark-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
