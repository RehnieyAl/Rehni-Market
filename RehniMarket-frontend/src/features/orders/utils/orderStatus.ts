import type { OrderStatus } from "../types/response";

// Única fuente de verdad de la etiqueta/color de cada estado, compartida por comprador y empresa.
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// Mismo grafo de transiciones que el backend; acá solo decide qué botón mostrar. DELIVERED/CANCELLED son de solo lectura.
export const NEXT_STATUS: Partial<Record<OrderStatus, { value: OrderStatus; label: string }>> = {
  pending: { value: "processing", label: "Iniciar procesamiento" },
  paid: { value: "processing", label: "Iniciar procesamiento" },
  processing: { value: "shipped", label: "Marcar enviado" },
  shipped: { value: "delivered", label: "Marcar entregado" },
};
