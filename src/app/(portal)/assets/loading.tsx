import { Skeleton } from "@/components/ui/skeleton";

export default function AssetsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-64 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
