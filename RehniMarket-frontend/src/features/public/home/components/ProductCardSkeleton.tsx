/** Esqueleto de carga con la misma geometría que ProductCard para no mover la cuadrícula (CLS). */
import { Skeleton } from "@/shared/components/ui";

export default function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-card border border-hairline bg-surface-1 p-2.5 sm:p-3">
      <Skeleton className="aspect-[4/3] w-full rounded-control dark:bg-surface-2" />

      <div className="flex flex-1 flex-col gap-2 px-1 pt-2.5">
        <Skeleton className="h-4 w-4/5 dark:bg-surface-2" />
        <Skeleton className="h-3 w-2/5 dark:bg-surface-2" />
        <Skeleton className="h-3 w-3/5 dark:bg-surface-2" />
        <Skeleton className="mt-auto h-5 w-24 dark:bg-surface-2" />
        <Skeleton className="h-10 w-full rounded-control dark:bg-surface-2" />
      </div>
    </div>
  );
}
