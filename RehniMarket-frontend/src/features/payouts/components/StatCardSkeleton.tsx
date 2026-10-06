export default function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-card border border-gray-200 bg-surface-1 p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="w-full space-y-3">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-7 w-32 rounded bg-gray-200" />
          <div className="h-3 w-28 rounded bg-gray-100" />
        </div>

        <div className="h-11 w-11 shrink-0 rounded-control bg-gray-100" />
      </div>
    </div>
  );
}
