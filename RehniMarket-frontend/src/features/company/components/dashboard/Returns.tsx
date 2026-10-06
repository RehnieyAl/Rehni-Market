import { useCallback, useEffect, useState } from "react";
import { Eye, RotateCcw, Search } from "lucide-react";

import { Badge, Button, EmptyState, Input, Skeleton } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";
import { getCompanyReturns } from "@/features/company/api/returnService";
import {
  RETURN_STATUS_LABEL,
  RETURN_STATUS_TONE,
} from "@/features/returns/utils/returnStatus";
import ReturnDetailModal from "./returns/ReturnDetailModal";

import type { ReturnRequest, ReturnStatus } from "@/features/returns/types/response";

type TabId = "all" | ReturnStatus;

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "En revisión" },
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Devoluciones</h1>

      <p className="mt-1 text-sm text-gray-500">
        Solicitudes de devolución de tus pedidos entregados. Revisa el motivo y aprueba o
        rechaza cada solicitud; al aprobar se reintegra el valor del producto al comprador
        en RehniCoin.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTab(tab.id)}
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

      <Input
        className="mt-6"
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
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<RotateCcw size={22} />}
          title={
            search || activeTab !== "all"
              ? "Sin resultados"
              : "No tienes solicitudes de devolución"
          }
          description={
            search || activeTab !== "all"
              ? "Ninguna solicitud coincide con este filtro."
              : "Cuando un comprador solicite una devolución de uno de tus pedidos, aparecerá aquí."
          }
        />
      ) : (
        <>
          <div className="mt-8 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 bg-surface-1 p-5 shadow-card transition hover:shadow-pop"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-gray-900">
                      {item.productName}
                    </p>
                    <Badge tone={RETURN_STATUS_TONE[item.status]}>
                      {RETURN_STATUS_LABEL[item.status]}
                    </Badge>
                  </div>

                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {item.buyerName} · {item.orderReference} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("es-CO")}
                  </p>

                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                    Motivo: {item.reason}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.itemSubtotal)}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    leadingIcon={<Eye size={16} />}
                    onClick={() => {
                      setSelectedId(item.id);
                      setDetailOpen(true);
                    }}
                  >
                    Ver detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>

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
        </>
      )}

      <ReturnDetailModal
        returnId={selectedId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onResolved={load}
      />
    </div>
  );
}
