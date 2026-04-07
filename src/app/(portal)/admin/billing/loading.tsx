export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-shark-100 rounded-lg" />
      <div className="h-4 w-32 bg-shark-50 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-24 bg-shark-50 rounded-xl border border-shark-100" />
        ))}
      </div>
      <div className="h-64 bg-shark-50 rounded-xl border border-shark-100" />
    </div>
  );
}
