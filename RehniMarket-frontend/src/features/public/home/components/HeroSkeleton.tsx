// Skeleton del Hero mientras se cargan los anuncios (ver ALCANCE >
// LOADING — HERO). Mantiene la misma altura que el Hero real para evitar
// saltos de layout cuando termina de cargar.
export default function HeroSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="h-[380px] w-full animate-pulse rounded-2xl bg-gray-200 sm:h-[440px] lg:h-[500px]" />
    </section>
  );
}
