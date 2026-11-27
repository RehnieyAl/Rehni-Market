/** Devoluciones en administración: todas las reclamaciones filtrables por estado y buscables por pedido,
 * empresa o comprador, con acceso al detalle para intervenir. */
import { useCallback, useEffect, useState } from "react";
import { Eye, RotateCcw, Search } from "lucide-react";

import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardFilterTabs from "@/shared/components/dashboard/DashboardFilterTabs";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import { Badge, Button, EmptyState, ErrorState, Input, Skeleton } from "@/shared/components/ui";
import { getAdminReturns } from "@/features/admin/api/returnService";
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from "@/features/returns/utils/returnStatus";
import AdminReturnDetailModal from "./AdminReturnDetailModal";

import type { ReturnStatus, ReturnsPaginated } from "@/features/returns/types/response";

type TabId = "all" | ReturnStatus;

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes de la empresa" },
  { id: "under_review", label: "Revisión de Rehni Market" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
];

const LIMIT = 10;

export default function AdminReturns() {
  const [tab, setTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReturnsPaginated | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setData(await getAdminReturns({ page, limit: LIMIT, status: tab, search }));
    } catch (error) {
      console.error("Error cargando las devoluciones:", error);
      setFailed(true);
    }
  }, [page, tab, search]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div>
      <DashboardPageHeader
        icon={<RotateCcw size={26} />}
        title="Devoluciones"
        description="Reclamaciones de compradores: interviene cuando una empresa no responde, está suspendida o el comprador pide revisar un rechazo."
      />

      <DashboardFilterTabs
        label="Estado de las devoluciones"
        options={TABS}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setPage(1);
        }}
      />

      <div className="mt-4">
        <Input
          type="search"
          aria-label="Buscar devoluciones"
          placeholder="Buscar por referencia del pedido, empresa o comprador…"
          value={search}
          leadingIcon={<Search size={16} />}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-5">
        {failed ? (
          <ErrorState title="No se pudieron cargar las devoluciones" onRetry={load} />
        ) : !data ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-card dark:bg-surface-2" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<RotateCcw size={22} />}
            title="Sin reclamaciones"
            description="No hay solicitudes de devolución con estos filtros."
          />
        ) : (
          <>
            <ul className="space-y-3">
              {data.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-hairline bg-surface-1 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{item.productName}</p>
                    <p className="text-sm text-ink-muted">
                      {item.reference} · Pedido {item.orderReference} · {item.companyName} · {item.buyerName}
                    </p>
                    <p className="text-xs text-ink-muted">{new Date(item.createdAt).toLocaleDateString("es-CO")}</p>
                  </div>
                  <Badge tone={RETURN_STATUS_TONE[item.status]}>{RETURN_STATUS_LABEL[item.status]}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    leadingIcon={<Eye size={15} />}
                    onClick={() => setSelectedId(item.id)}
                    aria-label={`Ver la reclamación ${item.reference}`}
                  >
                    Ver detalle
                  </Button>
                </li>
              ))}
            </ul>
            <DashboardPager page={page} totalPages={data.total_pages} onPageChange={setPage} />
          </>
        )}
      </div>

      <AdminReturnDetailModal
        returnId={selectedId}
        isOpen={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onChanged={load}
      />
    </div>
  );
}
