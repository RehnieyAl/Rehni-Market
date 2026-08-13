// Skeleton de tarjeta: imagen + empresa + nombre + precio (ver ALCANCE >
// LOADING — PRODUCTOS). Se muestra mientras se cargan los "Productos del
// día".
export default function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-square w-full bg-gray-100" />

      <div className="flex flex-col gap-2 p-4">
        <div className="h-4 w-4/5 rounded bg-gray-200" />
        <div className="h-3 w-2/5 rounded bg-gray-200" />
        <div className="mt-1 h-5 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  );
}
