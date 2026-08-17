import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, X } from "lucide-react";
import axios from "axios";

import { getCompanyOrderDetail, updateCompanyOrderStatus } from "@/features/company/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_BADGE, NEXT_STATUS } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Order } from "@/features/orders/types/response";

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  // Se llama tras un cambio de estado exitoso, para que la lista detrás
  // del modal (con sus pestañas/paginación propias) se refresque - el
  // modal no sabe en qué pestaña vive.
  onStatusChanged?: () => void;
}

// Detalle completo de un pedido recibido (ver ALCANCE > Refactor
// Pedidos Empresa, punto 7) - único lugar donde se cambia el estado de
// un pedido, accesible desde cualquier pestaña de "Pedidos" (ver
// Orders.tsx).
export default function OrderDetailModal({
  orderId,
  isOpen,
  onClose,
  onStatusChanged,
}: OrderDetailModalProps) {
  const { showAlert } = useAlert();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setOrder(null);
        const data = await getCompanyOrderDetail(orderId);
        if (!cancelled) setOrder(data);
      } catch (error) {
        console.error("Error cargando el detalle del pedido:", error);

        const message = axios.isAxiosError(error)
          ? error.response?.data?.detail?.message
          : undefined;

        showAlert("error", message ?? "No se pudo cargar el detalle del pedido.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const next = order ? NEXT_STATUS[order.status] : undefined;

  const handleAdvance = async () => {
    if (!order || !next) return;

    try {
      setAdvancing(true);
      const updated = await updateCompanyOrderStatus(order.id, next.value);
      setOrder(updated);
      showAlert("success", `Pedido ${updated.reference} actualizado a "${ORDER_STATUS_LABEL[updated.status]}".`);
      onStatusChanged?.();
    } catch (error) {
      console.error("Error actualizando el pedido:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo actualizar el estado del pedido.");
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Pedido {order?.reference ?? ""}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {loading || !order ? (
            <p className="py-8 text-center text-sm text-gray-500">Cargando pedido...</p>
          ) : (
            <div className="space-y-6">
              {/* ESTADO */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_BADGE[order.status]}`}
                >
                  {ORDER_STATUS_LABEL[order.status]}
                </span>

                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString("es-CO")}
                </span>
              </div>

              {/* COMPRADOR */}
              <section className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6D0F2D] text-lg font-bold text-white">
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

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-gray-900">{order.buyerName}</p>

                    <p className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Mail size={14} />
                      {order.buyerEmail}
                    </p>

                    {order.buyerPhone && (
                      <p className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={14} />
                        {order.buyerPhone}
                      </p>
                    )}
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="mt-4 flex items-start gap-1.5 border-t border-gray-200 pt-4 text-sm text-gray-600">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span>
                      {order.deliveryAddress.label && (
                        <span className="mr-1 font-medium text-gray-900">
                          {order.deliveryAddress.label} ·
                        </span>
                      )}
                      {order.deliveryAddress.address}, {order.deliveryAddress.city},{" "}
                      {order.deliveryAddress.department}
                    </span>
                  </div>
                )}
              </section>

              {/* PRODUCTOS */}
              <section>
                <h3 className="mb-3 font-semibold text-gray-900">Productos</h3>

                <div className="divide-y divide-gray-100 rounded-2xl border">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.productName}
                          {item.variantName ? ` (${item.variantName})` : ""}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>

                      <span className="shrink-0 font-medium text-gray-900">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* TOTALES */}
              <section className="space-y-1.5 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>IVA</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>

                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </section>
            </div>
          )}
        </div>

        {order && next && (
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="rounded-xl bg-[#7A1833] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {advancing ? "Actualizando..." : next.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
