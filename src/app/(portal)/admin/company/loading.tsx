export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-shark-100 dark:bg-shark-700 rounded-lg" />
      <div className="h-4 w-64 bg-shark-50 dark:bg-shark-800 rounded" />
      <div className="h-96 bg-shark-50 dark:bg-shark-800 rounded-xl border border-shark-100 dark:border-shark-700" />
    </div>
  );
}
