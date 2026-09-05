export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-6">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-zinc-800">
            <div className="aspect-square animate-pulse bg-zinc-800" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
