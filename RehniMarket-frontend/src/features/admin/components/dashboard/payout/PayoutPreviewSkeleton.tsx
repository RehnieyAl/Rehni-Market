// Skeleton de la vista previa financiera (ver GeneratePayoutModal.tsx) -
// mismo radio/spacing que el resto de skeletons del módulo (ver
// features/payouts/components/PayoutRowSkeleton.tsx).
export default function PayoutPreviewSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex justify-between">
        <div className="h-3 w-28 rounded bg-gray-200" />
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>

      <div className="flex justify-between">
        <div className="h-3 w-36 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>

      <div className="flex justify-between border-t border-gray-200 pt-3">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-4 w-24 rounded bg-gray-200" />
      </div>

      <div className="mt-2 space-y-2 border-t border-gray-200 pt-3">
        <div className="h-3 w-32 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
    </div>
  );
}
