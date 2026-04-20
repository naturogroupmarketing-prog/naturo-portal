import { Skeleton } from "@/components/ui/skeleton";

export default function HelpLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
