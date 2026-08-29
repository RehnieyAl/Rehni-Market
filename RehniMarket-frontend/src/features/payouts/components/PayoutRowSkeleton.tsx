// Skeleton de una fila de liquidación.
export default function PayoutRowSkeleton() {
  return (
    <div className="flex animate-pulse flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 bg-white p-5">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>

      <div className="flex items-center gap-6">
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="h-6 w-20 rounded-full bg-gray-100" />
        <div className="h-9 w-24 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
