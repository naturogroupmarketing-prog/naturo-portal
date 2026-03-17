import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-shark-200 rounded" />
        <div className="h-4 w-64 bg-shark-100 rounded mt-2" />
      </div>
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4">
            <div className="h-4 bg-shark-100 rounded w-full" />
            <div className="h-4 bg-shark-100 rounded w-5/6" />
            <div className="h-4 bg-shark-100 rounded w-4/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

