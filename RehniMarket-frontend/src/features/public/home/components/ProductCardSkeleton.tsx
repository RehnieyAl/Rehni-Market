import { Skeleton } from "@/shared/components/ui";

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-gray-200 bg-surface-1 dark:border-hairline dark:bg-surface-1">
      <Skeleton className="w-full rounded-none pb-[72%] dark:bg-surface-2" />

      <div className="flex flex-col gap-2 px-3 pb-3 pt-2.5">
        <Skeleton className="h-4 w-4/5 dark:bg-surface-2" />
        <Skeleton className="h-3 w-2/5 dark:bg-surface-2" />
        <Skeleton className="h-3 w-3/5 dark:bg-surface-2" />
        <Skeleton className="h-5 w-24 dark:bg-surface-2" />
        <Skeleton className="mt-1 h-9 w-full rounded-control dark:bg-surface-2" />
      </div>
    </div>
  );
}
