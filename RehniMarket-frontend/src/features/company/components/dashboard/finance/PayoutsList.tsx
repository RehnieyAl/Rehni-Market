import { useCallback, useEffect, useState } from "react";
import { Eye, Receipt } from "lucide-react";

import PayoutDetailModal from "@/features/payouts/components/PayoutDetailModal";
import PayoutRowSkeleton from "@/features/payouts/components/PayoutRowSkeleton";
import PayoutStatusBadge from "@/features/payouts/components/PayoutStatusBadge";
import { Button, EmptyState } from "@/shared/components/ui";

import { getCompanyPayoutDetail, getCompanyPayouts } from "@/features/company/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyPayout } from "@/features/payouts/types/response";

const PAGE_SIZE = 10;

export default function PayoutsList() {
  const [payouts, setPayouts] = useState<CompanyPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCompanyPayouts(page, PAGE_SIZE);
      setPayouts(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando liquidaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timeout = setTimeout(loadPayouts);
    return () => clearTimeout(timeout);
  }, [loadPayouts]);

  const handleOpenDetail = (payoutId: string) => {
    setSelectedPayoutId(payoutId);
    setDetailOpen(true);
  };

  return (
    <div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <PayoutRowSkeleton key={index} />
          ))}
        </div>
      ) : payouts.length === 0 ? (
        <EmptyState
          icon={<Receipt size={22} />}
          title="Aún no tienes liquidaciones"
          description="Cuando Rehni Market genere tu primera liquidación mensual, aparecerá aquí."
        />
      ) : (
        <>
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 bg-surface-1 p-5 shadow-card transition hover:shadow-pop"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {new Date(payout.periodStart).toLocaleDateString("es-CO")} —{" "}
                    {new Date(payout.periodEnd).toLocaleDateString("es-CO")}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Ventas: {formatPrice(payout.grossSales)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(payout.netAmount)}
                  </span>

                  <PayoutStatusBadge status={payout.payoutStatus} />

                  <Button
                    variant="outline"
                    size="sm"
                    leadingIcon={<Eye size={16} />}
                    onClick={() => handleOpenDetail(payout.id)}
                  >
                    Ver detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-5">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Anterior
              </Button>

              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      <PayoutDetailModal
        payoutId={selectedPayoutId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        fetchDetail={getCompanyPayoutDetail}
      />
    </div>
  );
}
