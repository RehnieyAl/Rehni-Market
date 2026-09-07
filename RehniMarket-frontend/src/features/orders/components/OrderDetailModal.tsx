import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Store } from "lucide-react";
import axios from "axios";

import OrderTimeline from "./OrderTimeline";
import OrderShippingInfo from "./OrderShippingInfo";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { Badge, Modal, Button, Spinner } from "@/shared/components/ui";
import { RotateCcw } from "lucide-react";
import RequestReturnModal from "@/features/returns/components/RequestReturnModal";
import ReturnStatusCard from "@/features/returns/components/ReturnStatusCard";
import { canRequestItemReturn } from "@/features/returns/utils/returnStatus";
import { getMyOrderDetail, cancelMyOrder } from "@/features/orders/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";
import { formatAttributePairs } from "@/shared/utils/formatAttributes";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Order } from "@/features/orders/types/response";

const CANCELLABLE_STATUSES = new Set(["pending", "paid"]);

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelled?: () => void;
}

export default function OrderDetailModal({
  orderId,
  isOpen,
  onClose,
  onCancelled,
}: OrderDetailModalProps) {
  const { showAlert } = useAlert();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const [returnItem, setReturnItem] = useState<
    { id: string; productName: string; variantName: string | null } | null
  >(null);

  const reloadOrder = async () => {
    if (!orderId) return;
    try {
      const data = await getMyOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Error recargando el pedido:", error);
    }
  };

  useEffect(() => {
    if (!isOpen || !orderId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setOrder(null);
        const data = await getMyOrderDetail(orderId);
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
  }, [isOpen, orderId]);

  const handleCancel = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      const updated = await cancelMyOrder(order.id);
      setOrder(updated);
      showAlert("success", `Pedido ${updated.reference} cancelado.`);
      onCancelled?.();
    } catch (error) {
      console.error("Error cancelando el pedido:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo cancelar el pedido.");
    } finally {
      setCancelling(false);
      setConfirmCancelOpen(false);
    }
  };

  const totalDiscount = order
    ? order.items.reduce((sum, item) => {
        if (!item.originalUnitPrice) return sum;

        const diff = (Number(item.originalUnitPrice) - Number(item.unitPrice)) * item.quantity;

        return sum + Math.max(diff, 0);
      }, 0)
    : 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={`Pedido ${order?.reference ?? ""}`}
        footer={
          order && CANCELLABLE_STATUSES.has(order.status) ? (
            <Button
              variant="outline"
              className="border-danger/40 text-danger hover:bg-danger-bg"
              loading={cancelling}
              onClick={() => setConfirmCancelOpen(true)}
            >
              Cancelar pedido
            </Button>
          ) : undefined
        }
      >
        {loading || !order ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Spinner /> Cargando pedido…
          </div>
        ) : (
          <div className="space-y-6">

              <div className="flex items-center justify-between">
                <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>

                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString("es-CO")}
                </span>
              </div>

              <OrderTimeline status={order.status} />

              <section className="rounded-card bg-gray-50 p-4">
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
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">Productos</h3>

                  <Link
                    to={`/company/${order.companyId}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
                    aria-label={`Ver la tienda de ${order.companyName}`}
                  >
                    <Store size={14} />
                    {order.companyName} · Ver tienda
                  </Link>
                </div>

                <div className="divide-y divide-gray-100 overflow-hidden rounded-card border border-gray-200">
                  {order.items.map((item) => {
                    const combo = formatAttributePairs(item.attributes) || item.variantName;
                    const itemReturn = order.returns.find(
                      (entry) => entry.orderItemId === item.id,
                    );

                    return (
                    <div key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {item.productName}
                          </p>

                          {combo && (
                            <p className="text-xs text-gray-500">{combo}</p>
                          )}

                          <p className="text-xs text-gray-500">
                            {item.quantity} ×{" "}
                            {item.originalUnitPrice && (
                              <span className="mr-1 line-through">
                                {formatPrice(item.originalUnitPrice)}
                              </span>
                            )}
                            {formatPrice(item.unitPrice)}
                          </p>
                        </div>

                        <span className="shrink-0 font-medium text-gray-900">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>

                      {itemReturn ? (
                        <ReturnStatusCard data={itemReturn} />
                      ) : (
                        canRequestItemReturn(order.status, item.id, order.returns) && (
                          <button
                            type="button"
                            onClick={() =>
                              setReturnItem({
                                id: item.id,
                                productName: item.productName,
                                variantName: item.variantName,
                              })
                            }
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            <RotateCcw size={13} />
                            Solicitar devolución
                          </button>
                        )
                      )}
                    </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-gray-900">Envío</h3>
                <OrderShippingInfo
                  carrier={order.shippingCarrier}
                  trackingNumber={order.trackingNumber}
                />
              </section>

              <section className="space-y-1.5 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Descuentos</span>
                    <span>-{formatPrice(totalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>IVA</span>
                  <span>
                    {Number(order.tax) > 0 ? formatPrice(order.tax) : "No aplica"}
                  </span>
                </div>

                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </section>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmCancelOpen}
        title="Cancelar pedido"
        message="¿Cancelar este pedido? Esta acción no se puede deshacer."
        confirmLabel="Cancelar pedido"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setConfirmCancelOpen(false)}
      />

      <RequestReturnModal
        key={returnItem?.id ?? "none"}
        orderId={order?.id ?? ""}
        item={returnItem}
        isOpen={returnItem !== null}
        onClose={() => setReturnItem(null)}
        onSubmitted={() => {
          reloadOrder();
          onCancelled?.();
        }}
      />
    </>
  );
}
