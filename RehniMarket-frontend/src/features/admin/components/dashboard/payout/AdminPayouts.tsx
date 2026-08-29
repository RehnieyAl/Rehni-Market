import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, Receipt } from "lucide-react";

import GeneratePayoutModal from "./GeneratePayoutModal";
import AdminPayoutDetailModal from "./AdminPayoutDetailModal";

import PayoutRowSkeleton from "@/features/payouts/components/PayoutRowSkeleton";
import PayoutStatusBadge from "@/features/payouts/components/PayoutStatusBadge";
import ComingSoon from "@/shared/components/dashboard/ComingSoon";

import { getAdminPayouts } from "@/features/admin/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyPayout, PayoutStatus } from "@/features/payouts/types/response";

const PAGE_SIZE = 10;

type TabId = "all" | PayoutStatus;

// Los 4 valores de PayoutStatusEnum + "Todos"; hoy solo se producen "pending"/"paid".
const STATUS_TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "processing", label: "Procesando" },
  { id: "paid", label: "Pagadas" },
  { id: "failed", label: "Fallidas" },
];

// Panel "Liquidaciones" del admin: listar, filtrar, ver detalle, generar y marcar como pagada.
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

  // Diferido con setTimeout para no hacer setState síncrono dentro del efecto.
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
          <h1 className="text-3xl font-bold">Liquidaciones</h1>

          <p className="mt-2 max-w-xl text-gray-500">
            Genera y administra las liquidaciones mensuales de las empresas: comisión del 5% sobre
            ventas entregadas, giro del 95% neto a su cuenta bancaria.
          </p>
        </div>

        <button
          onClick={() => setGenerateOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#6D0F2D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5b0d26]"
        >
          <Plus size={16} />
          Generar liquidación
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[#7A1833] text-white"
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
        <ComingSoon
          icon={<Receipt className="h-10 w-10 text-red-700" />}
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
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md"
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
