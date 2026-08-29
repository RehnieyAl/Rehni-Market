import type { BadgeTone } from "@/shared/components/ui";

import type { OrderStatus } from "../types/response";

// Única fuente de verdad de la etiqueta/tono de cada estado, compartida por comprador y empresa.
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

// Mismo grafo de transiciones que el backend; acá solo decide qué botón mostrar. DELIVERED/CANCELLED son de solo lectura.
export const NEXT_STATUS: Partial<Record<OrderStatus, { value: OrderStatus; label: string }>> = {
  pending: { value: "processing", label: "Iniciar procesamiento" },
  paid: { value: "processing", label: "Iniciar procesamiento" },
  processing: { value: "shipped", label: "Marcar enviado" },
  shipped: { value: "delivered", label: "Marcar entregado" },
};
