import { Skeleton } from "@/shared/components/ui";

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white">
      <Skeleton className="w-full rounded-none pb-[75%]" />

      <div className="flex flex-col gap-2 px-3.5 pb-3 pt-2.5">
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
