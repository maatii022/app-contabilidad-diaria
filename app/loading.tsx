export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(111,159,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(90,255,177,0.08),_transparent_20%),linear-gradient(180deg,_#09101f_0%,_#050814_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute bottom-24 right-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex-1 space-y-5">
          <section className="surface-card overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="loading-shimmer h-3 w-24 rounded-full" />
                <div className="loading-shimmer h-9 w-40 rounded-2xl" />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="loading-dot" />
                <span className="text-xs uppercase tracking-[0.18em] text-white/55">cargando</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[22px] border border-white/8 bg-white/[0.035] p-4">
                  <div className="loading-shimmer h-3 w-16 rounded-full" />
                  <div className="loading-shimmer mt-3 h-7 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <div className="loading-shimmer h-4 w-28 rounded-full" />
              <div className="loading-shimmer h-4 w-20 rounded-full" />
            </div>

            <div className="mt-6 flex h-44 items-end gap-2 overflow-hidden px-1">
              {Array.from({ length: 14 }).map((_, index) => (
                <div key={index} className="flex flex-1 items-end justify-center">
                  <div
                    className="loading-bar w-full rounded-full"
                    style={{
                      height: `${30 + ((index * 17) % 70)}%`,
                      animationDelay: `${index * 55}ms`
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="surface-card p-4">
              <div className="loading-shimmer h-3 w-24 rounded-full" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-white/[0.03] p-3">
                    <div className="loading-shimmer h-3 w-20 rounded-full" />
                    <div className="loading-shimmer mt-2 h-4 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-4">
              <div className="loading-shimmer h-3 w-24 rounded-full" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-white/[0.03] p-3">
                    <div className="loading-shimmer h-3 w-16 rounded-full" />
                    <div className="loading-shimmer mt-2 h-4 w-28 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="relative z-10 mt-8">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-[28px] border border-white/10 bg-black/50 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center justify-center gap-2 rounded-[20px] px-2 py-3">
                <div className="loading-shimmer h-5 w-5 rounded-full" />
                <div className="loading-shimmer h-2.5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
