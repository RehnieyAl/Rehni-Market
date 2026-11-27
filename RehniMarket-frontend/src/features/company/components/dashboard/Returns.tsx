/** Devoluciones del panel de empresa: filtros por estado, búsqueda, listado paginado y detalle para aprobar
 * o rechazar cada solicitud (el reintegro en RehniCoin lo hace el backend al aprobar). */
import { useCallback, useEffect, useState } from "react";
import { Eye, List, RotateCcw, Search } from "lucide-react";

import { Badge, Button, EmptyState, Input, Skeleton } from "@/shared/components/ui";
import DashboardFilterTabs from "@/shared/components/dashboard/DashboardFilterTabs";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { formatPrice } from "@/shared/utils/formatPrice";
import { getCompanyReturns } from "@/features/company/api/returnService";
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from "@/features/returns/utils/returnStatus";
import ReturnDetailModal from "./returns/ReturnDetailModal";

import type { ReturnRequest, ReturnStatus } from "@/features/returns/types/response";

type TabId = "all" | ReturnStatus;

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "En revisión" },
  { id: "under_review", label: "Revisión de Rehni Market" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
];

export default function Returns() {
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCompanyReturns({
        page,
        limit: 10,
        status: activeTab,
        search: search || undefined,
      });
      setItems(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando devoluciones:", error);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  const handleTab = (tab: TabId) => {
    setActiveTab(tab);
    setPage(1);
  };

  const clearFilters = () => {
    setActiveTab("all");
    setSearch("");
    setPage(1);
  };

  const filtering = Boolean(search) || activeTab !== "all";

  return (
    <div>
      <DashboardPageHeader
        icon={<RotateCcw size={26} />}
        title="Devoluciones"
        description="Solicitudes de devolución de tus pedidos entregados. Revisa el motivo y aprueba o rechaza cada solicitud; al aprobar se reintegra el valor del producto al comprador en RehniCoin."
      />

      <div className="mt-6">
        <DashboardFilterTabs label="Filtrar devoluciones por estado" options={TABS} value={activeTab} onChange={handleTab} />
      </div>

      <Input
        className="mt-5"
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Buscar por referencia, correo o nombre del comprador…"
        aria-label="Buscar devoluciones"
        leadingIcon={<Search size={16} />}
      />

      {loading ? (
        <div className="mt-5 space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-card dark:bg-surface-2" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={<RotateCcw size={22} />}
          title={filtering ? "Sin resultados" : "No tienes solicitudes de devolución"}
          description={
            filtering
              ? "No hay solicitudes de devolución que coincidan con este filtro."
              : "Cuando un comprador solicite una devolución de uno de tus pedidos, aparecerá aquí."
          }
          action={
            filtering ? (
              <Button variant="outline" leadingIcon={<RotateCcw size={16} />} onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DashboardSection title="Lista de devoluciones" icon={<List size={20} />} className="mt-5">
          <ul className="space-y-3">
            {items.map((item) => (
              <ReturnRow
                key={item.id}
                item={item}
                onOpen={() => {
                  setSelectedId(item.id);
                  setDetailOpen(true);
                }}
              />
            ))}
          </ul>

          <DashboardPager page={page} totalPages={totalPages} onPageChange={setPage} />
        </DashboardSection>
      )}

      <ReturnDetailModal returnId={selectedId} isOpen={detailOpen} onClose={() => setDetailOpen(false)} onResolved={load} />
    </div>
  );
}

function ReturnRow({ item, onOpen }: { item: ReturnRequest; onOpen: () => void }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface-2/40 p-3 sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-ink">{item.productName}</p>
          <Badge tone={RETURN_STATUS_TONE[item.status]} dot>
            {RETURN_STATUS_LABEL[item.status]}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-muted">
          {item.buyerName} · {item.orderReference} ·{" "}
          <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("es-CO")}</time>
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-gray-400">Motivo: {item.reason}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold tabular-nums text-ink">{formatPrice(item.itemSubtotal)}</span>
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<Eye size={16} />}
          onClick={onOpen}
          aria-label={`Ver detalle de la devolución de ${item.productName}`}
        >
          Ver detalle
        </Button>
      </div>
    </li>
  );
}
