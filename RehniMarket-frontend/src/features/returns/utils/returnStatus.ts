import type { BadgeTone } from "@/shared/components/ui";

import type { OrderItemReturn, ReturnStatus } from "../types/response";

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  pending: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export const RETURN_STATUS_TONE: Record<ReturnStatus, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

/**
 * El comprador puede pedir la devolución de un ítem solo si el pedido está entregado
 * y ese ítem no tiene ya una devolución registrada (el backend además exige que no
 * haya una activa).
 */
export function canRequestItemReturn(
  orderStatus: string,
  itemId: string,
  existingReturns: OrderItemReturn[],
): boolean {
  if (orderStatus !== "delivered") return false;
  return !existingReturns.some((entry) => entry.orderItemId === itemId);
}
