import type { BadgeTone } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  paid: "info",
  processing: "info",
  shipped: "brand",
  delivered: "success",
  cancelled: "danger",
};

export function isCancellable(status: OrderStatus): boolean {
  return status === "pending" || status === "paid";
}
