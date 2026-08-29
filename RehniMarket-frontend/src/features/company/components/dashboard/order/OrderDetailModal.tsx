import { useEffect, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import axios from "axios";

import { getCompanyOrderDetail, updateCompanyOrderStatus } from "@/features/company/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, NEXT_STATUS } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";
import { formatAttributePairs } from "@/shared/utils/formatAttributes";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Badge, Modal, Button, Spinner } from "@/shared/components/ui";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Pedido ${order?.reference ?? ""}`}
      footer={
        order && next ? (
          <Button loading={advancing} onClick={handleAdvance}>
            {next.label}
          </Button>
        ) : undefined
      }
    >
      {loading || !order ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Spinner /> Cargando pedido...
        </div>
      ) : (
        <div className="space-y-6">

              <div className="flex items-center justify-between">
                <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>

                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString("es-CO")}
                </span>
              </div>

              <section className="rounded-card border bg-gray-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-white">
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

              <section>
                <h3 className="mb-3 font-semibold text-gray-900">Productos</h3>

                <div className="divide-y divide-gray-100 rounded-card border">
                  {order.items.map((item) => {
                    const combo = formatAttributePairs(item.attributes) || item.variantName;

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {item.productName}
                          </p>

                          {combo && <p className="text-xs text-gray-500">{combo}</p>}

                          <p className="text-xs text-gray-500">
                            {item.quantity} × {formatPrice(item.unitPrice)}
                          </p>
                        </div>

                        <span className="shrink-0 font-medium text-gray-900">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

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
    </Modal>
  );
}
