import { Skeleton } from "@/components/ui/skeleton";

export default function QuickReturnLoading() {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-14 w-full rounded-[28px]" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-[28px]" />
    </div>
  );
}
