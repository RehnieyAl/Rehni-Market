export default function ProductDetailSkeleton() {
  return (
    <div className="theme-dark mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] animate-pulse px-2 py-6 sm:px-4 sm:py-8 lg:px-8">
      <div className="h-4 w-32 rounded bg-white/10" />

      <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface-1">
        <div className="grid lg:grid-cols-2">
          <div className="border-b border-hairline p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="order-2 flex gap-3 sm:order-1 sm:w-20 sm:flex-col">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 w-20 shrink-0 rounded-xl bg-white/10" />
                ))}
              </div>

              <div className="order-1 min-h-[280px] flex-1 rounded-2xl bg-white/10 sm:order-2" />
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6 lg:p-8">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-8 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="h-8 w-40 rounded bg-white/10" />
            <div className="h-20 w-full rounded-2xl bg-white/10" />
            <div className="h-9 w-full rounded-xl bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-white/10" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-card bg-white/10" />
        ))}
      </div>

      <div className="mt-10 h-40 rounded-2xl bg-white/10" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-52 rounded-2xl bg-white/10" />
        <div className="h-52 rounded-2xl bg-white/10" />
      </div>

      <div className="mt-12">
        <div className="h-6 w-56 rounded bg-white/10" />

        <div className="mt-4 flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 w-44 shrink-0 rounded-2xl bg-white/10 sm:w-52" />
          ))}
        </div>
      </div>
    </div>
  );
}
