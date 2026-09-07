import { api } from "@/api/Client";

import type { OrderItemReturn, ReturnRequest } from "../types/response";

/** Devoluciones del comprador para uno de sus pedidos. */
export async function getOrderReturns(orderId: string): Promise<ReturnRequest[]> {
  const { data } = await api.get<ReturnRequest[]>(`/orders/${orderId}/returns`);
  return data;
}

/** El comprador solicita la devolución de un ítem de un pedido entregado. */
export async function requestReturn(
  orderId: string,
  payload: { orderItemId: string; reason: string },
): Promise<ReturnRequest> {
  const { data } = await api.post<ReturnRequest>(`/orders/${orderId}/returns`, payload);
  return data;
}

export type { OrderItemReturn };
