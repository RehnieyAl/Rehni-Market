/** "Mis pedidos" del comprador: cada compra con empresa, productos, total y estado; detalle con
 * seguimiento y devoluciones, y cancelación de los pedidos pendientes o pagados. */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Package, ShoppingBag } from "lucide-react";

import ConfirmModal from "@/shared/components/ConfirmModal";
import OrderDetailModal from "@/features/orders/components/OrderDetailModal";
import { getMyOrders, cancelMyOrder } from "@/features/orders/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";
import { formatAttributePairs } from "@/shared/utils/formatAttributes";
import { useAlert } from "@/shared/components/alert/useAlert";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import { Badge, Button, EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import type { Order } from "@/features/orders/types/response";

const CANCELLABLE_STATUSES = new Set(["pending", "paid"]);

export default function Orders() {
  const { showAlert } = useAlert();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const response = await getMyOrders(1, 20);
      setOrders(response.items);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadOrders);
    return () => clearTimeout(timeout);
  }, [loadOrders]);

  const handleCancel = async () => {
    if (!confirmCancelId) return;

    try {
      setCancellingId(confirmCancelId);
      const updated = await cancelMyOrder(confirmCancelId);

      setOrders((prev) => prev.map((order) => (order.id === confirmCancelId ? updated : order)));
    } catch (error) {
      console.error("Error cancelando el pedido:", error);
      showAlert("error", "No se pudo cancelar el pedido.");
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={<Package size={26} />}
        title="Mis pedidos"
        description="Consulta el estado, el envío y el detalle de tus compras."
      />

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-card" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState title="No pudimos cargar tus pedidos" onRetry={loadOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={22} />}
          title="Todavía no tienes pedidos"
          description="Cuando hagas tu primera compra, podrás seguir su estado desde aquí."
          action={
            <Link to="/products" className={buttonClasses({ size: "sm" })}>
              Explorar productos
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-card border border-hairline bg-surface-1 p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-2 text-base font-semibold text-ink"
                >
                  {order.companyName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {order.firstItemName}
                    {order.totalItems > 1 ? ` y ${order.totalItems - 1} más` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Pedido a {order.companyName} · {new Date(order.createdAt).toLocaleDateString("es-CO")}
                  </p>
                  <p className="text-xs text-ink-muted">{order.reference}</p>
                </div>
                <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
              </div>

              <ul className="mt-4 divide-y divide-hairline rounded-control bg-surface-2/60 px-4">
                {order.items.map((item) => {
                  const combo = formatAttributePairs(item.attributes) || item.variantName;
                  return (
                    <li key={item.id} className="flex justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0 text-ink-muted">
                        {item.quantity} × {item.productName}
                        {combo ? ` (${combo})` : ""}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-ink">{formatPrice(item.subtotal)}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-muted">
                  Total <span className="ml-1 text-lg font-semibold tabular-nums text-ink">{formatPrice(order.total)}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {CANCELLABLE_STATUSES.has(order.status) && (
                    <button
                      type="button"
                      disabled={cancellingId === order.id}
                      onClick={() => setConfirmCancelId(order.id)}
                      className="inline-flex h-9 items-center rounded-control px-3.5 text-sm font-medium text-danger transition hover:bg-danger-bg disabled:opacity-50"
                    >
                      {cancellingId === order.id ? "Cancelando…" : "Cancelar pedido"}
                    </button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    leadingIcon={<Eye size={15} />}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setDetailOpen(true);
                    }}
                  >
                    Ver detalle
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onCancelled={loadOrders}
      />

      <ConfirmModal
        isOpen={confirmCancelId !== null}
        title="Cancelar pedido"
        message="¿Cancelar este pedido? Esta acción no se puede deshacer."
        confirmLabel="Cancelar pedido"
        loading={cancellingId !== null}
        onConfirm={handleCancel}
        onClose={() => setConfirmCancelId(null)}
      />
    </div>
  );
}
