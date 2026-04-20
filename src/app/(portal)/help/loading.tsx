export default function HelpLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-shark-100 dark:bg-shark-800 rounded w-48" />
        <div className="h-4 bg-shark-100 dark:bg-shark-800 rounded w-80 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-shark-100 dark:border-shark-800 bg-white dark:bg-shark-900 p-6 h-64" />
        <div className="rounded-2xl border border-shark-100 dark:border-shark-800 bg-white dark:bg-shark-900 p-6 h-64" />
      </div>
      <div className="rounded-2xl border border-shark-100 dark:border-shark-800 bg-white dark:bg-shark-900 p-6 h-80" />
    </div>
  );
}
