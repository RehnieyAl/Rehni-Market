/** Etiquetas y tonos de los estados y eventos de una reclamación, y la regla de cuándo se puede abrir una. */
import type { BadgeTone } from "@/shared/components/ui";

import type { CallOutcome, OrderItemReturn, ReturnEventType, ReturnStatus } from "../types/response";

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  pending: "En revisión",
  under_review: "Revisión de Rehni Market",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export const RETURN_STATUS_TONE: Record<ReturnStatus, BadgeTone> = {
  pending: "warning",
  under_review: "info",
  approved: "success",
  rejected: "danger",
};

export const RETURN_EVENT_LABEL: Record<ReturnEventType, string> = {
  requested: "Solicitud del comprador",
  company_approved: "La empresa aprobó",
  company_rejected: "La empresa rechazó",
  refunded: "Reembolso acreditado en RehniCoin",
  review_requested: "El comprador pidió revisión",
  escalated: "Intervención de Rehni Market",
  admin_approved: "Rehni Market aprobó",
  admin_rejected: "Rehni Market rechazó",
  admin_email: "Correo de Rehni Market a la empresa",
  admin_call: "Llamada de Rehni Market a la empresa",
};

export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  contacted: "Se habló con la empresa",
  no_answer: "No contestó",
  wrong_number: "Número equivocado",
  callback_requested: "Pidió que se le llame después",
};

/**
 * Una sola reclamación por producto: si ya existe (en cualquier estado) no se abre otra; un rechazo
 * se revisa con "Solicitar revisión" sobre la misma reclamación. Es la misma regla del backend.
 */
export function canRequestItemReturn(
  orderStatus: string,
  itemId: string,
  existingReturns: OrderItemReturn[],
): boolean {
  if (orderStatus !== "delivered") return false;
  return !existingReturns.some((entry) => entry.orderItemId === itemId);
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}
