/** Pedidos del panel de empresa: pestañas por estado con contadores, búsqueda, paginación y detalle. */
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Eye, List, Search, ShoppingBag, Truck } from "lucide-react";

import { Badge, Button, EmptyState, Input, Skeleton } from "@/shared/components/ui";
import DashboardFilterTabs from "@/shared/components/dashboard/DashboardFilterTabs";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
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

  const loadOrders = useCallback(async () => {
    const activeStatuses = STATUS_TABS.find((tab) => tab.id === activeTab)?.statuses;

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
    void loadOrders();
    void loadCounts();
  };

  const countFor = (tab: TabId) =>
    countsLoading ? "…" : String(counts[tab === "all" ? "all" : tab]);

  const filtering = Boolean(search) || activeTab !== "all";

  return (
    <div>
      <DashboardPageHeader
        icon={<Truck size={26} />}
        title="Pedidos"
        description="Gestiona los pedidos recibidos: filtra por estado, busca por referencia o comprador y actualiza su estado desde el detalle."
      />

      <div className="mt-6">
        <DashboardFilterTabs
          label="Filtrar pedidos por estado"
          options={STATUS_TABS.map((tab) => ({ id: tab.id, label: tab.label, count: countFor(tab.id) }))}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <Input
        className="mt-5"
        type="search"
        value={search}
        onChange={(event) => handleSearch(event.target.value)}
        placeholder="Buscar por referencia, correo o nombre del comprador…"
        aria-label="Buscar pedidos"
        leadingIcon={<Search size={16} />}
      />

      <DashboardSection title="Lista de pedidos" icon={<List size={20} />} className="mt-5">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-card dark:bg-surface-2" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={<ShoppingBag size={22} />}
            title={filtering ? "Sin resultados" : "Aún no has recibido pedidos"}
            description={
              filtering
                ? "Ningún pedido coincide con este filtro y esta búsqueda."
                : "Cuando un comprador te haga un pedido, aparecerá aquí."
            }
          />
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} onOpen={() => handleOpenDetail(order.id)} />
            ))}
          </ul>
        )}

        <DashboardPager page={page} totalPages={totalPages} onPageChange={setPage} />
      </DashboardSection>

      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
}

function OrderRow({ order, onOpen }: { order: Order; onOpen: () => void }) {
  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-card border border-hairline bg-surface-2/40 p-3 sm:p-4 lg:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,2fr)_auto]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-white">
        {order.buyerPhoto ? (
          <img src={order.buyerPhoto} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{order.buyerName.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{order.buyerName}</p>
        <p className="truncate text-sm text-ink-muted">{order.buyerEmail}</p>
      </div>

      <dl className="col-span-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:col-span-1">
        <div className="flex items-start gap-2">
          <ClipboardList size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted" />
          <div className="min-w-0">
            <dt className="text-xs text-ink-muted">Pedido</dt>
            <dd className="truncate font-semibold text-ink">{order.reference}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CalendarDays size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted" />
          <div>
            <dt className="text-xs text-ink-muted">Fecha</dt>
            <dd className="font-semibold text-ink">
              <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString("es-CO")}</time>
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Total</dt>
          <dd className="font-semibold tabular-nums text-ink">{formatPrice(order.total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Estado</dt>
          <dd>
            <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
              {ORDER_STATUS_LABEL[order.status]}
            </Badge>
          </dd>
        </div>
      </dl>

      <div className="col-span-2 flex justify-end lg:col-span-1">
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<Eye size={16} />}
          onClick={onOpen}
          aria-label={`Ver detalle del pedido ${order.reference}`}
        >
          Ver detalle
        </Button>
      </div>
    </li>
  );
}
