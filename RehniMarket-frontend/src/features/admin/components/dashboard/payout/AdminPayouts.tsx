import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, Receipt } from "lucide-react";

import GeneratePayoutModal from "./GeneratePayoutModal";
import AdminPayoutDetailModal from "./AdminPayoutDetailModal";

import PayoutRowSkeleton from "@/features/payouts/components/PayoutRowSkeleton";
import PayoutStatusBadge from "@/features/payouts/components/PayoutStatusBadge";
import { Button, EmptyState } from "@/shared/components/ui";

import { getAdminPayouts } from "@/features/admin/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyPayout, PayoutStatus } from "@/features/payouts/types/response";

const PAGE_SIZE = 10;

type TabId = "all" | PayoutStatus;

const STATUS_TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "processing", label: "Procesando" },
  { id: "paid", label: "Pagadas" },
  { id: "failed", label: "Fallidas" },
];

export default function AdminPayouts() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [payouts, setPayouts] = useState<CompanyPayout[]>([]);
  const [loading, setLoading] = useState(true);

  const [generateOpen, setGenerateOpen] = useState(false);

  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPayouts(
        page,
        PAGE_SIZE,
        activeTab === "all" ? undefined : activeTab,
      );
      setPayouts(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando liquidaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    const timeout = setTimeout(loadPayouts);
    return () => clearTimeout(timeout);
  }, [loadPayouts]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleOpenDetail = (payoutId: string) => {
    setSelectedPayoutId(payoutId);
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Liquidaciones</h1>

          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Genera y administra las liquidaciones mensuales de las empresas: comisión del 5% sobre
            ventas entregadas, giro del 95% neto a su cuenta bancaria.
          </p>
        </div>

        <Button leadingIcon={<Plus size={16} />} onClick={() => setGenerateOpen(true)}>
          Generar liquidación
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-primary text-primary-fg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <PayoutRowSkeleton key={index} />
          ))}
        </div>
      ) : payouts.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Receipt size={22} />}
          title={activeTab === "all" ? "Aún no hay liquidaciones" : "Sin resultados"}
          description={
            activeTab === "all"
              ? "Genera la primera liquidación de una empresa con el botón de arriba."
              : "Ninguna liquidación coincide con este filtro."
          }
        />
      ) : (
        <>
          <div className="mt-8 space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 bg-surface-1 p-5 shadow-card transition hover:shadow-pop"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {payout.companyName ?? "Empresa"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(payout.periodStart).toLocaleDateString("es-CO")} —{" "}
                    {new Date(payout.periodEnd).toLocaleDateString("es-CO")}
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

      <GeneratePayoutModal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerated={loadPayouts}
      />

      <AdminPayoutDetailModal
        payoutId={selectedPayoutId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onPaid={loadPayouts}
      />
    </div>
  );
}
