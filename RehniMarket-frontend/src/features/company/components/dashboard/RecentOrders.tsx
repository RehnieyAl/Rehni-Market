/** Pedidos recientes del inicio del panel de empresa: los últimos pedidos reales con estado y total. */
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";

import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";
import { getCompanyOrders } from "@/features/company/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/utils/orderStatus";

import type { Order } from "@/features/orders/types/response";

const RECENT_LIMIT = 5;
const relativeTime = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 15 minutos", "hace 3 horas", "ayer"… a partir de la fecha de creación del pedido. */
function formatTimeAgo(isoDate: string, now: number = Date.now()): string {
  const minutes = Math.round((new Date(isoDate).getTime() - now) / 60_000);

  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour");
  return relativeTime.format(Math.round(hours / 24), "day");
}

export default function RecentOrders({ onViewAll }: { onViewAll: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);
        const response = await getCompanyOrders(1, RECENT_LIMIT);
        if (!cancelled) setOrders(response.items);
      } catch (error) {
        console.error("Error cargando los pedidos recientes:", error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <DashboardSection
      title="Pedidos recientes"
      icon={<ShoppingCart size={18} />}
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex min-h-9 items-center gap-1 rounded-control px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-secondary brand-link"
        >
          Ver todos
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 dark:bg-surface-2" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState
          title="No se pudieron cargar los pedidos"
          description="Intenta de nuevo en unos momentos."
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          variant="plain"
          title="Todavía no tienes pedidos"
          description="Cuando un comprador te compre, el pedido aparecerá aquí."
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">#{order.reference}</p>
                <p className="truncate text-xs text-ink-muted">
                  {order.buyerName} ·{" "}
                  <time dateTime={order.createdAt} title={new Date(order.createdAt).toLocaleString("es-CO")}>
                    {formatTimeAgo(order.createdAt)}
                  </time>
                </p>
              </div>

              <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>

              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
                {formatPrice(order.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
