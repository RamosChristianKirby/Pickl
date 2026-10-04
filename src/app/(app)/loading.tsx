export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="mt-4 h-48 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
