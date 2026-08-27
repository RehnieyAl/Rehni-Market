import { useCallback, useEffect, useState } from "react";
import { Eye, Receipt } from "lucide-react";

import PayoutDetailModal from "@/features/payouts/components/PayoutDetailModal";
import PayoutRowSkeleton from "@/features/payouts/components/PayoutRowSkeleton";
import PayoutStatusBadge from "@/features/payouts/components/PayoutStatusBadge";
import ComingSoon from "@/shared/components/dashboard/ComingSoon";

import { getCompanyPayoutDetail, getCompanyPayouts } from "@/features/company/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyPayout } from "@/features/payouts/types/response";

const PAGE_SIZE = 10;

// Historial de liquidaciones de la empresa (ver ALCANCE > Módulo de
// liquidaciones, Fase 6) - solo lectura, GET /company/payouts +
// GET /company/payouts/{id}. La empresa nunca genera ni marca como pagada
// su propia liquidación (eso es exclusivo admin).
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

  // Diferido con setTimeout (mismo patrón que Orders.tsx/RehniCoin.tsx):
  // evita hacer setState de forma síncrona dentro del efecto.
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
        <ComingSoon
          icon={<Receipt className="h-10 w-10 text-red-700" />}
          title="Aún no tienes liquidaciones"
          description="Cuando Rehni Market genere tu primera liquidación mensual, aparecerá aquí."
        />
      ) : (
        <>
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md"
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

                <div className="flex items-center gap-6">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(payout.netAmount)}
                  </span>

                  <PayoutStatusBadge status={payout.payoutStatus} />

                  <button
                    onClick={() => handleOpenDetail(payout.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Eye size={16} />
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-5">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-xl border px-4 py-2 disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-xl border px-4 py-2 disabled:opacity-50"
              >
                Siguiente
              </button>
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
