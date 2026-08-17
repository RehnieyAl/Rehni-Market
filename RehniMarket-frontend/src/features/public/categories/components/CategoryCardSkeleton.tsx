// Skeleton de tarjeta de categoría (mismo patrón que ProductCardSkeleton,
// ver features/public/home/components) mientras se cargan los catálogos.
export default function CategoryCardSkeleton() {
  return (
    <div className="relative flex animate-pulse flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white">
      <div className="relative aspect-[4/3] w-full bg-gray-200">
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-gray-300/70" />
            <div className="h-3 w-1/3 rounded bg-gray-300/70" />
          </div>

          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-300/70" />
        </div>
      </div>
    </div>
  );
}
