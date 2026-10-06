import { useCallback, useEffect, useState } from "react";
import { Eye, Search, ShoppingBag } from "lucide-react";

import { Badge, Button, EmptyState, Input, Skeleton } from "@/shared/components/ui";
import OrderDetailModal from "./order/OrderDetailModal";

import {
  getCompanyOrders,
  getCompanyOrderStatusCounts,
} from "@/features/company/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { Order, OrderStatus, OrderStatusCounts } from "@/features/orders/types/response";

type TabId = "all" | "pending" | "inProgress" | "completed" | "cancelled";

const STATUS_TABS: { id: TabId; label: string; statuses?: OrderStatus[] }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes", statuses: ["pending"] },
  { id: "inProgress", label: "En proceso", statuses: ["processing", "shipped"] },
  { id: "completed", label: "Completados", statuses: ["delivered"] },
  { id: "cancelled", label: "Cancelados", statuses: ["cancelled"] },
];

const EMPTY_COUNTS: OrderStatusCounts = {
  all: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState<OrderStatusCounts>(EMPTY_COUNTS);
  const [countsLoading, setCountsLoading] = useState(true);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const activeStatuses = STATUS_TABS.find((tab) => tab.id === activeTab)?.statuses;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCompanyOrders(page, 10, activeStatuses, search || undefined);
      setOrders(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  const loadCounts = useCallback(async () => {
    try {
      setCountsLoading(true);
      const response = await getCompanyOrderStatusCounts();
      setCounts(response);
    } catch (error) {
      console.error("Error cargando los contadores de pedidos:", error);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadOrders, 300);
    return () => clearTimeout(timeout);
  }, [loadOrders]);

  useEffect(() => {
    const timeout = setTimeout(loadCounts);
    return () => clearTimeout(timeout);
  }, [loadCounts]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleOpenDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailOpen(true);
  };

  const handleStatusChanged = () => {
    loadOrders();
    loadCounts();
  };

  const countFor = (tab: TabId) =>
    countsLoading ? "…" : String(counts[tab === "all" ? "all" : tab]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Pedidos</h1>

      <p className="mt-1 text-sm text-gray-500">
        Gestiona los pedidos recibidos: filtra por estado, busca por referencia o comprador y
        actualiza su estado desde el detalle.
      </p>

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
            {tab.label} ({countFor(tab.id)})
          </button>
        ))}
      </div>

      <Input
        className="mt-6"
        type="search"
        value={search}
        onChange={(event) => handleSearch(event.target.value)}
        placeholder="Buscar por referencia, correo o nombre del comprador…"
        aria-label="Buscar pedidos"
        leadingIcon={<Search size={16} />}
      />

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-card" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<ShoppingBag size={22} />}
          title={search || activeTab !== "all" ? "Sin resultados" : "Aún no has recibido pedidos"}
          description={
            search || activeTab !== "all"
              ? "Ningún pedido coincide con este filtro y esta búsqueda."
              : "Cuando un comprador te haga un pedido, aparecerá aquí."
          }
        />
      ) : (
        <>
          <div className="mt-8 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 bg-surface-1 p-5 shadow-card transition hover:shadow-pop"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white">
                    {order.buyerPhoto ? (
                      <img
                        src={order.buyerPhoto}
                        alt={order.buyerName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      order.buyerName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{order.buyerName}</p>
                    <p className="truncate text-sm text-gray-500">{order.buyerEmail}</p>

                    <p className="mt-1 text-xs text-gray-400">
                      {order.reference} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(order.total)}
                  </span>

                  <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    leadingIcon={<Eye size={16} />}
                    onClick={() => handleOpenDetail(order.id)}
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

      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
}
