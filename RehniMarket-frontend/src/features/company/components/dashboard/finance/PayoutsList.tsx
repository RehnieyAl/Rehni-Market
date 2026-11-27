/** Liquidaciones de la empresa en tabla: identificador, periodo, ventas brutas, comisión, monto liquidado y
 * estado, con detalle. `recentOnly` muestra las últimas en el resumen financiero con acceso a "Ver todas". */
import { useCallback, useEffect, useId, useState } from "react";
import { ChevronRight, Eye, FileText, List, Receipt } from "lucide-react";

import PayoutDetailModal from "@/features/payouts/components/PayoutDetailModal";
import PayoutRowSkeleton from "@/features/payouts/components/PayoutRowSkeleton";
import PayoutStatusBadge from "@/features/payouts/components/PayoutStatusBadge";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { Button, EmptyState, ErrorState } from "@/shared/components/ui";
import { getCompanyPayoutDetail, getCompanyPayouts } from "@/features/company/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyPayout } from "@/features/payouts/types/response";

const PAGE_SIZE = 10;
const RECENT_SIZE = 4;

const dateFormat = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" });

function formatPeriod(payout: CompanyPayout) {
  return `${dateFormat.format(new Date(payout.periodStart))} – ${dateFormat.format(new Date(payout.periodEnd))}`;
}

interface PayoutsListProps {
  recentOnly?: boolean;
  onViewAll?: () => void;
}

export default function PayoutsList({ recentOnly = false, onViewAll }: PayoutsListProps) {
  const [payouts, setPayouts] = useState<CompanyPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const captionId = useId();
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const response = await getCompanyPayouts(page, recentOnly ? RECENT_SIZE : PAGE_SIZE);
      setPayouts(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando liquidaciones:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [page, recentOnly]);

  useEffect(() => {
    const timeout = setTimeout(loadPayouts);
    return () => clearTimeout(timeout);
  }, [loadPayouts]);

  let content;
  if (loading) {
    content = (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: recentOnly ? 3 : 4 }).map((_, index) => (
          <PayoutRowSkeleton key={index} />
        ))}
      </div>
    );
  } else if (failed) {
    content = (
      <ErrorState title="No se pudieron cargar las liquidaciones" description="Intenta de nuevo en unos momentos." onRetry={loadPayouts} />
    );
  } else if (payouts.length === 0) {
    content = (
      <EmptyState
        variant="plain"
        icon={<Receipt size={22} />}
        title="Aún no tienes liquidaciones"
        description="Cuando Rehni Market genere tu primera liquidación mensual, aparecerá aquí."
      />
    );
  } else {
    content = (
      // El contenedor desplaza la tabla en pantallas estrechas sin desbordar la página; es enfocable y tiene
      // nombre para que el teclado también pueda desplazarlo.
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className="-mx-1 overflow-x-auto px-1 focus-visible:outline-2 focus-visible:outline-secondary"
      >
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption id={captionId} className="sr-only">
            Liquidaciones de tu empresa
          </caption>
          <thead>
            <tr className="border-b border-hairline text-xs text-ink-muted">
              <th scope="col" className="py-2 pr-3 font-medium">ID de liquidación</th>
              <th scope="col" className="py-2 pr-3 font-medium">Periodo</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Ventas brutas</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Comisión</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Monto liquidado</th>
              <th scope="col" className="py-2 pr-3 font-medium">Estado</th>
              <th scope="col" className="py-2 font-medium"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => {
              const shortId = payout.id.slice(0, 8).toUpperCase();
              return (
                <tr key={payout.id} className="border-b border-hairline last:border-0">
                  <th scope="row" className="py-3 pr-3 font-semibold text-ink">
                    <span className="inline-flex items-center gap-2" title={payout.id}>
                      <FileText size={16} aria-hidden="true" className="text-ink-muted" />
                      {shortId}
                    </span>
                  </th>
                  <td className="py-3 pr-3 text-ink-muted">{formatPeriod(payout)}</td>
                  <td className="py-3 pr-3 text-right tabular-nums text-ink">{formatPrice(payout.grossSales)}</td>
                  <td className="py-3 pr-3 text-right tabular-nums text-ink">{formatPrice(payout.commissionAmount)}</td>
                  <td className="py-3 pr-3 text-right font-semibold tabular-nums text-ink">{formatPrice(payout.netAmount)}</td>
                  <td className="py-3 pr-3"><PayoutStatusBadge status={payout.payoutStatus} /></td>
                  <td className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={<Eye size={16} />}
                      onClick={() => {
                        setSelectedPayoutId(payout.id);
                        setDetailOpen(true);
                      }}
                      aria-label={`Ver detalle de la liquidación ${shortId}`}
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
    );
  }

  return (
    <DashboardSection
      title={recentOnly ? "Liquidaciones recientes" : "Liquidaciones"}
      icon={<List size={20} />}
      className="h-full"
      action={
        recentOnly && onViewAll ? (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            Ver todas
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        ) : undefined
      }
    >
      <p className="-mt-2 mb-4 text-sm text-ink-muted">Historial de liquidaciones procesadas y en proceso.</p>
      {content}
      {!recentOnly && <DashboardPager page={page} totalPages={totalPages} onPageChange={setPage} />}

      <PayoutDetailModal
        payoutId={selectedPayoutId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        fetchDetail={getCompanyPayoutDetail}
      />
    </DashboardSection>
  );
}
