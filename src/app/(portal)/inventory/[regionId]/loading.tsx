export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-40 bg-shark-100 rounded" />
      <div className="h-8 w-56 bg-shark-200 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-shark-100 rounded-xl" />
        ))}
      </div>
      <div className="h-10 bg-shark-100 rounded-xl" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-shark-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
