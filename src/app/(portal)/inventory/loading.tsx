export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-shark-200 rounded-lg" />
      <div className="h-4 w-64 bg-shark-100 rounded" />
      <div className="h-10 w-60 bg-shark-100 rounded-xl" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-shark-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
