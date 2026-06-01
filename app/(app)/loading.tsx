/**
 * Route-segment loading skeleton for the (app) group. Shows while server
 * components are still awaiting Supabase queries so the screen stays
 * visually settled instead of going blank on slow connections.
 */
export default function AppLoading() {
  return (
    <div className="space-y-6 fade-in" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <section className="glass aurora-bg p-5 sm:p-7 md:p-10">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded bg-tint-3 animate-pulse" />
          <div className="h-9 w-3/4 rounded bg-tint-3 animate-pulse" />
          <div className="h-9 w-1/2 rounded bg-tint-3 animate-pulse" />
          <div className="h-3 w-48 rounded bg-tint-2 animate-pulse" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass p-5">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-md bg-tint-3 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded bg-tint-3 animate-pulse" />
                <div className="h-6 w-12 rounded bg-tint-3 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass p-6 space-y-3">
            <div className="h-3 w-24 rounded bg-tint-3 animate-pulse" />
            <div className="h-6 w-2/3 rounded bg-tint-3 animate-pulse" />
            <div className="h-4 w-full rounded bg-tint-2 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-tint-2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
