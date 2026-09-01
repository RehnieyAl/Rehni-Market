import type { BadgeTone } from "@/shared/components/ui";

import type { OrderStatus } from "../types/response";

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

export const NEXT_STATUS: Partial<Record<OrderStatus, { value: OrderStatus; label: string }>> = {
  pending: { value: "processing", label: "Iniciar procesamiento" },
  paid: { value: "processing", label: "Iniciar procesamiento" },
  processing: { value: "shipped", label: "Marcar enviado" },
  shipped: { value: "delivered", label: "Marcar entregado" },
};
