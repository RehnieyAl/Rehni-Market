export default function BankAccountCardSkeleton() {
  return (
    <div className="animate-pulse rounded-card border border-gray-200 bg-surface-1 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-gray-200" />
          <div className="h-3 w-48 rounded bg-gray-100" />
          <div className="h-3 w-28 rounded bg-gray-100" />
        </div>

        <div className="h-6 w-16 shrink-0 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
