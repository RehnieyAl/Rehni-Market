/** Esqueleto de carga con la misma geometría que CategoryCard (evita saltos de diseño). */
export default function CategoryCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-card border border-hairline bg-surface-1">
      <div className="aspect-[16/10] w-full bg-gray-200" />

      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>

        <div className="h-4 w-4 shrink-0 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
