// Skeleton de tarjeta de categoría (mismo patrón que ProductCardSkeleton,
// ver features/public/home/components) mientras se cargan los catálogos.
// Mismo layout que CategoryCard.tsx (imagen arriba + cuerpo blanco debajo)
// para no "saltar" de forma entre el skeleton y la tarjeta real.
export default function CategoryCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-video w-full bg-gray-200" />

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>

        <div className="h-4 w-4 shrink-0 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
