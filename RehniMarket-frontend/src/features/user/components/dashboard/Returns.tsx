/** "Mis devoluciones" del comprador: sus reclamaciones con estado, empresa, reembolso y acceso al detalle. */
import { useCallback, useEffect, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";

import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import { Badge, Button, EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";
import MyReturnDetailModal from "@/features/returns/components/MyReturnDetailModal";
import { getMyReturns } from "@/features/returns/api/returnService";
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from "@/features/returns/utils/returnStatus";

import type { ReturnsPaginated } from "@/features/returns/types/response";

const LIMIT = 10;

export default function Returns() {
  const [data, setData] = useState<ReturnsPaginated | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setData(await getMyReturns(page, LIMIT));
    } catch (error) {
      console.error("Error cargando las devoluciones:", error);
      setFailed(true);
    }
  }, [page]);

  useEffect(() => {
    const timeout = setTimeout(load);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={<RotateCcw size={26} />}
        title="Mis devoluciones"
        description="Sigue tus solicitudes de devolución, la respuesta de cada empresa y tus reembolsos en RehniCoin."
      />

      {failed ? (
        <ErrorState title="No pudimos cargar tus devoluciones" onRetry={load} />
      ) : !data ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-card" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<RotateCcw size={22} />}
          title="No tienes solicitudes de devolución"
          description="Puedes solicitar la devolución de un producto desde el detalle de un pedido entregado."
        />
      ) : (
        <>
          <ul className="space-y-4">
            {data.items.map((item) => (
              <li key={item.id} className="rounded-card border border-hairline bg-surface-1 p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-secondary/15 text-secondary"
                  >
                    <RotateCcw size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{item.productName}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      Pedido {item.orderReference} · {item.companyName} ·{" "}
                      {new Date(item.createdAt).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <Badge tone={RETURN_STATUS_TONE[item.status]}>{RETURN_STATUS_LABEL[item.status]}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                  <span className="text-sm text-ink-muted">
                    {item.status === "approved" && item.refundAmount
                      ? `Reembolsado: ${formatPrice(item.refundAmount)} en RehniCoin`
                      : item.canRequestReview
                        ? "Puedes solicitar una revisión"
                        : `Referencia ${item.reference}`}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    leadingIcon={<Eye size={15} />}
                    onClick={() => setSelectedId(item.id)}
                    aria-label={`Ver la devolución de ${item.productName} (${item.reference})`}
                  >
                    Ver detalle
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <DashboardPager page={page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}

      <MyReturnDetailModal
        returnId={selectedId}
        isOpen={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onChanged={load}
      />
    </div>
  );
}
