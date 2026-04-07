export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-shark-100 rounded-lg" />
      <div className="h-4 w-64 bg-shark-50 rounded" />
      <div className="h-32 bg-shark-50 rounded-xl border border-shark-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-40 bg-shark-50 rounded-xl border border-shark-100" />
        ))}
      </div>
    </div>
  );
}
