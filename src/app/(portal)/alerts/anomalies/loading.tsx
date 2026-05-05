import { Skeleton } from "@/components/ui/skeleton";

export default function AnomaliesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[28px]" />
        ))}
      </div>
    </div>
  );
}
