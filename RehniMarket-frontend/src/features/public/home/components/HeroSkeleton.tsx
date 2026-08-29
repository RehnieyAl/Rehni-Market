export default function HeroSkeleton() {
  return (
    <section className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 pt-2 sm:px-4 lg:px-8">
      <div className="relative h-[240px] w-full animate-pulse overflow-hidden rounded-2xl bg-gray-200 shadow-lg sm:h-[300px] md:h-[360px] lg:h-[400px] lg:rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />

        <div className="absolute bottom-5 left-6 flex gap-2 sm:left-10 lg:left-14">
          <div className="h-2 w-7 rounded-full bg-white/60" />
          <div className="h-2 w-2 rounded-full bg-white/40" />
          <div className="h-2 w-2 rounded-full bg-white/40" />
        </div>
      </div>
    </section>
  );
}
