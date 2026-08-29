import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ShoppingBag } from "lucide-react";

import ConfirmModal from "@/shared/components/ConfirmModal";
import OrderDetailModal from "@/features/orders/components/OrderDetailModal";
import { getMyOrders, cancelMyOrder } from "@/features/orders/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";
import { formatAttributePairs } from "@/shared/utils/formatAttributes";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mis pedidos</h1>

      <p className="mt-1 text-sm text-gray-500">
        Consulta el estado y el historial de tus pedidos.
      </p>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-card" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState
          className="mt-8"
          title="No pudimos cargar tus pedidos"
          onRetry={loadOrders}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          className="mt-8"
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
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-card border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.firstItemName}
                    {order.totalItems > 1 ? ` y ${order.totalItems - 1} más` : ""}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Pedido a {order.companyName} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </div>

                <Badge tone={ORDER_STATUS_TONE[order.status]}>
                  {ORDER_STATUS_LABEL[order.status]}
                </Badge>
              </div>

              <div className="mt-3 divide-y divide-gray-100 border-t border-gray-100 pt-3">
                {order.items.map((item) => {
                  const combo = formatAttributePairs(item.attributes) || item.variantName;

                  return (
                    <div key={item.id} className="flex justify-between gap-3 py-1.5 text-sm">
                      <span className="text-gray-600">
                        {item.quantity} × {item.productName}
                        {combo ? ` (${combo})` : ""}
                      </span>
                      <span className="font-medium">{formatPrice(item.subtotal)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900">
                  Total: {formatPrice(order.total)}
                </span>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setDetailOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Eye size={15} />
                    Ver detalle
                  </button>

                  {CANCELLABLE_STATUSES.has(order.status) && (
                    <button
                      onClick={() => setConfirmCancelId(order.id)}
                      disabled={cancellingId === order.id}
                      className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                    >
                      {cancellingId === order.id ? "Cancelando…" : "Cancelar pedido"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
