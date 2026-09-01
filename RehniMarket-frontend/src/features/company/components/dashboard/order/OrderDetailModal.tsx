import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Store, Truck, Pencil } from "lucide-react";
import axios from "axios";

import {
  getCompanyOrderDetail,
  updateCompanyOrderStatus,
  getActiveShippingCarriers,
  updateCompanyOrderShipping,
  type ActiveShippingCarrier,
} from "@/features/company/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, NEXT_STATUS } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";
import { formatAttributePairs } from "@/shared/utils/formatAttributes";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Badge, Modal, Button, Input, Select, Spinner } from "@/shared/components/ui";
import OrderShippingInfo from "@/features/orders/components/OrderShippingInfo";

import type { Order } from "@/features/orders/types/response";

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged?: () => void;
}

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

  const [carriers, setCarriers] = useState<ActiveShippingCarrier[]>([]);
  const [editingShipping, setEditingShipping] = useState(false);
  const [carrierId, setCarrierId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setOrder(null);
        setEditingShipping(false);

        const data = await getCompanyOrderDetail(orderId);
        if (cancelled) return;

        setOrder(data);
        setCarrierId(data.shippingCarrier?.id ?? "");
        setTrackingNumber(data.trackingNumber ?? "");

        try {
          const list = await getActiveShippingCarriers();
          if (!cancelled) setCarriers(list);
        } catch (carrierError) {
          console.error("Error cargando transportadoras:", carrierError);
        }
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

  const shippingValid = carrierId !== "" && trackingNumber.trim().length >= 3;

  const handleSaveShipping = async () => {
    if (!order || !shippingValid || savingShipping) return;

    try {
      setSavingShipping(true);
      const updated = await updateCompanyOrderShipping(
        order.id,
        carrierId,
        trackingNumber.trim(),
      );
      setOrder(updated);
      setEditingShipping(false);
      showAlert("success", `Información de envío guardada para el pedido ${updated.reference}.`);
      onStatusChanged?.();
    } catch (error) {
      console.error("Error guardando la información de envío:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo guardar la información de envío.");
    } finally {
      setSavingShipping(false);
    }
  };

  const hasShipping = Boolean(order?.shippingCarrier && order?.trackingNumber);
  const showShippingForm = !hasShipping || editingShipping;

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

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900">Envío</h3>

              {hasShipping && !editingShipping && (
                <Button
                  variant="outline"
                  size="sm"
                  leadingIcon={<Pencil size={15} />}
                  onClick={() => setEditingShipping(true)}
                >
                  Editar envío
                </Button>
              )}
            </div>

            {showShippingForm ? (
              <div className="space-y-4 rounded-card border border-gray-200 p-4">
                <Select
                  label="Transportadora"
                  value={carrierId}
                  disabled={savingShipping}
                  onChange={(e) => setCarrierId(e.target.value)}
                >
                  <option value="">Selecciona una transportadora</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Número de guía"
                  value={trackingNumber}
                  disabled={savingShipping}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ej. 123456789"
                  error={
                    trackingNumber.length > 0 && trackingNumber.trim().length < 3
                      ? "Indica un número de guía válido."
                      : undefined
                  }
                />

                <div className="flex flex-wrap justify-end gap-3">
                  {hasShipping && (
                    <Button
                      variant="outline"
                      disabled={savingShipping}
                      onClick={() => {
                        setEditingShipping(false);
                        setCarrierId(order.shippingCarrier?.id ?? "");
                        setTrackingNumber(order.trackingNumber ?? "");
                      }}
                    >
                      Cancelar
                    </Button>
                  )}

                  <Button
                    leadingIcon={<Truck size={16} />}
                    loading={savingShipping}
                    disabled={!shippingValid}
                    onClick={handleSaveShipping}
                  >
                    Guardar información de envío
                  </Button>
                </div>
              </div>
            ) : (
              <OrderShippingInfo
                carrier={order.shippingCarrier}
                trackingNumber={order.trackingNumber}
              />
            )}
          </section>

          <section className="space-y-1.5 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>

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
  );
}
