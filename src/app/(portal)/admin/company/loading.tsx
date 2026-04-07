export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-shark-100 rounded-lg" />
      <div className="h-4 w-64 bg-shark-50 rounded" />
      <div className="h-96 bg-shark-50 rounded-xl border border-shark-100" />
    </div>
  );
}
