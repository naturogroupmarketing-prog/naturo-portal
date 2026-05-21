import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-60 rounded-[20px]" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
