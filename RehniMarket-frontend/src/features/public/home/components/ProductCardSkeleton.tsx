// Skeleton de tarjeta: mismas proporciones que ProductCard.tsx (imagen +
// empresa + nombre + calificación + precio + CTA) para que la carga no
// "salte" al reemplazarse por la tarjeta real.
export default function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-[4/3] w-full bg-gray-100" />

      <div className="flex flex-col gap-2 px-3.5 pb-3 pt-2.5">
        <div className="h-3 w-2/5 rounded bg-gray-200" />
        <div className="h-4 w-4/5 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-200" />
        <div className="mt-1 h-5 w-1/2 rounded bg-gray-200" />
        <div className="mt-1 h-8 w-full rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
