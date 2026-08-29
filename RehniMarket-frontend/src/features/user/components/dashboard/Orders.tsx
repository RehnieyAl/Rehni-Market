import { useCallback, useEffect, useState } from "react";
import { Eye, ShoppingBag } from "lucide-react";

import ComingSoon from "@/shared/components/dashboard/ComingSoon";
import ConfirmModal from "@/shared/components/ConfirmModal";
import OrderDetailModal from "@/features/orders/components/OrderDetailModal";
import { getMyOrders, cancelMyOrder } from "@/features/orders/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_BADGE } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";
import { formatAttributePairs } from "@/shared/utils/formatAttributes";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Order } from "@/features/orders/types/response";

const CANCELLABLE_STATUSES = new Set(["pending", "paid"]);

export default function Orders() {
  const { showAlert } = useAlert();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyOrders(1, 20);
      setOrders(response.items);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
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
      <h1 className="text-3xl font-bold">Mis pedidos</h1>

      <p className="mt-2 text-gray-500">
        Consulta el estado y el historial de tus pedidos.
      </p>

      {loading ? (
        <p className="mt-8 text-gray-500">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <ComingSoon
          icon={<ShoppingBag className="h-10 w-10 text-red-700" />}
          title="Mis pedidos"
          description="Aquí podrás consultar todos tus pedidos cuando el sistema de compras esté disponible."
          action={{ label: "Explorar productos", to: "/products" }}
        />
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border bg-white p-5">
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

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_BADGE[order.status]}`}
                >
                  {ORDER_STATUS_LABEL[order.status]}
                </span>
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
                    className="flex items-center gap-1.5 text-sm font-medium text-[#6D0F2D] hover:underline"
                  >
                    <Eye size={15} />
                    Ver detalle
                  </button>

                  {CANCELLABLE_STATUSES.has(order.status) && (
                    <button
                      onClick={() => setConfirmCancelId(order.id)}
                      disabled={cancellingId === order.id}
                      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {cancellingId === order.id ? "Cancelando..." : "Cancelar pedido"}
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
