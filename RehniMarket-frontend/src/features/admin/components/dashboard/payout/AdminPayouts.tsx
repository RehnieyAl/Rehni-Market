/** Liquidaciones (solo owner): empresas por consignar al cierre de cada mes (generadas y por generar) con
 * su neto, fecha límite y estado, filtradas por estado y paginadas en el backend; generación y detalle con el pago. */
import { useCallback, useEffect, useId, useState } from "react";
import { Eye, Plus, Receipt } from "lucide-react";

import GeneratePayoutModal from "./GeneratePayoutModal";
import AdminPayoutDetailModal from "./AdminPayoutDetailModal";
import PendingPayoutDetailModal from "./PendingPayoutDetailModal";

import PayoutRowSkeleton from "@/features/payouts/components/PayoutRowSkeleton";
import PayoutStatusBadge from "@/features/payouts/components/PayoutStatusBadge";
import DashboardFilterTabs from "@/shared/components/dashboard/DashboardFilterTabs";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import { Badge, Button, EmptyState } from "@/shared/components/ui";

import { getAdminPayouts } from "@/features/admin/api/payoutService";
import { formatDateOnly, formatPeriodStartLabel } from "@/features/payouts/utils/period";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { AdminPayoutListItem, PayoutStatus } from "@/features/payouts/types/response";

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
  const [total, setTotal] = useState(0);
  const captionId = useId();

  const [payouts, setPayouts] = useState<AdminPayoutListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [generateOpen, setGenerateOpen] = useState(false);

  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<AdminPayoutListItem | null>(null);

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPayouts(
        page,
        PAGE_SIZE,
        activeTab === "all" ? undefined : activeTab,
      );
      setPayouts(response.items);
      setTotal(response.total);
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

  const handleOpenDetail = (item: AdminPayoutListItem) => {
    if (!item.id) {
      setPendingItem(item);
      return;
    }

    setSelectedPayoutId(item.id);
    setDetailOpen(true);
  };

  return (
    <div>
      <DashboardPageHeader
        icon={<Receipt size={26} />}
        title="Liquidaciones"
        description="Genera y administra las liquidaciones mensuales de las empresas: comisión del 5% sobre ventas entregadas, giro del 95% neto a su cuenta bancaria."
        action={
          <Button leadingIcon={<Plus size={16} />} onClick={() => setGenerateOpen(true)}>
            Generar liquidación
          </Button>
        }
      />

      <div className="mt-6">
        <DashboardFilterTabs
          label="Filtrar liquidaciones por estado"
          options={STATUS_TABS}
          value={activeTab}
          onChange={handleTabChange}
        />
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
        <section className="mt-8 rounded-card border border-hairline bg-surface-1">
          {/* El contenedor desplaza la tabla en pantallas estrechas sin desbordar la página; es enfocable y
              tiene nombre para que el teclado también pueda desplazarlo. */}
          <div
            tabIndex={0}
            role="region"
            aria-labelledby={captionId}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-secondary"
          >
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption id={captionId} className="sr-only">
                Empresas con liquidaciones por consignar
              </caption>
              <thead>
                <tr className="border-b border-hairline text-xs text-ink-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Empresa</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Periodo</th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">Neto por consignar</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Fecha límite</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Estado</th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => {
                  const companyName = payout.companyName ?? "Empresa";
                  const period = formatPeriodStartLabel(payout.periodStart);

                  return (
                    <tr
                      key={payout.id ?? `${payout.companyId}-${payout.periodStart}`}
                      className="border-b border-hairline last:border-0"
                    >
                      <th scope="row" className="px-5 py-3 font-semibold text-ink">
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-2 text-sm font-semibold text-ink"
                          >
                            {companyName.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate">{companyName}</span>
                        </span>
                      </th>
                      <td className="py-3 pr-4 text-ink-muted">{period}</td>
                      <td className="py-3 pr-4 text-right font-semibold tabular-nums text-ink">
                        {formatPrice(payout.netAmount)}
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">{formatDateOnly(payout.consignmentDeadline)}</td>
                      <td className="py-3 pr-4">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <PayoutStatusBadge status={payout.payoutStatus} />
                          {!payout.isGenerated && <Badge tone="neutral">Por generar</Badge>}
                          {payout.isOverdue && <Badge tone="danger">Vencida</Badge>}
                        </span>
                      </td>
                      <td className="py-3 pr-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leadingIcon={<Eye size={16} />}
                          onClick={() => handleOpenDetail(payout)}
                          aria-label={`Ver detalle de ${companyName}, ${period}`}
                        >
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline px-5 py-3">
            <p className="text-sm font-medium text-ink">
              {total} {total === 1 ? "registro" : "registros"}
            </p>
            <div className="min-w-[16rem] flex-1">
              <DashboardPager page={page} totalPages={totalPages} onPageChange={setPage} inline />
            </div>
          </div>
        </section>
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

      <PendingPayoutDetailModal
        item={pendingItem}
        onClose={() => setPendingItem(null)}
        onGenerated={loadPayouts}
      />
    </div>
  );
}
