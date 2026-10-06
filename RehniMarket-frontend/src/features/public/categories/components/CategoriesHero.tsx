export default function CategoriesHero() {
  return (
    <section className="border-b border-hairline bg-gradient-to-b from-surface-1 to-canvas">
      <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 py-8 text-center sm:px-4 sm:py-10 lg:px-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          Explorar categorías
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted sm:text-base">
          Encuentra productos increíbles en todas nuestras categorías.
        </p>
      </div>
    </section>
  );
}
