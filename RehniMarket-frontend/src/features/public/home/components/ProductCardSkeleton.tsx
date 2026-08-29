import { Skeleton } from "@/shared/components/ui";

// Silueta de ProductCard (imagen cuadrada + empresa + nombre + precio + acción)
// para que la carga no "salte" al reemplazarse por la tarjeta real.
export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white">
      <Skeleton className="w-full rounded-none pb-[100%]" />

      <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-3">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
        <div className="mt-2 flex items-end justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-9 rounded-control" />
        </div>
      </div>
    </div>
  );
}
