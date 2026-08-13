// Skeleton con la misma silueta que la página real (galería + info) para
// no mostrar una pantalla vacía mientras carga (ver ALCANCE > LOADING).
export default function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="h-4 w-32 rounded bg-gray-200" />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="aspect-square w-full rounded-2xl bg-gray-200" />

          <div className="mt-4 flex gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 w-16 shrink-0 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-24 w-full rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
