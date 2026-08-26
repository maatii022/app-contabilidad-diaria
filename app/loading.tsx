export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="neu h-[52px] w-[52px] rounded-[18px]" />
        <div className="glass flex items-center gap-3 rounded-[20px] px-4 py-3">
          <span className="loading-dot" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">cargando</span>
        </div>
      </div>

      <section className="surface-card overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            <div className="loading-shimmer h-3 w-24 rounded-full" />
            <div className="loading-shimmer h-9 w-44 rounded-2xl" />
          </div>
          <div className="loading-shimmer h-8 w-24 rounded-2xl" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="neu rounded-[20px] p-3.5">
              <div className="loading-shimmer h-8 w-8 rounded-[12px]" />
              <div className="loading-shimmer mt-3 h-2.5 w-14 rounded-full" />
              <div className="loading-shimmer mt-2 h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <div className="loading-shimmer h-4 w-32 rounded-full" />
          <div className="loading-shimmer h-4 w-16 rounded-full" />
        </div>

        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="loading-shimmer h-2.5 w-24 rounded-full" />
                <div className="loading-shimmer h-2.5 w-14 rounded-full" />
              </div>
              <div className="bar-track h-2.5 rounded-full">
                <div className="loading-shimmer h-2.5 rounded-full" style={{ width: `${90 - index * 22}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
