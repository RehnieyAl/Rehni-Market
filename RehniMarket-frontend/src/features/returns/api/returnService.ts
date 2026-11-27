/** API del comprador para sus reclamaciones de devolución: abrir, seguir y pedir revisión. */
import { api } from "@/api/Client";

import type { ReturnDetail, ReturnRequest, ReturnsPaginated } from "../types/response";

/** El comprador solicita la devolución de un ítem de un pedido entregado. */
export async function requestReturn(
  orderId: string,
  payload: { orderItemId: string; reason: string },
): Promise<ReturnRequest> {
  const { data } = await api.post<ReturnRequest>(`/orders/${orderId}/returns`, payload);
  return data;
}

export async function getMyReturns(page = 1, limit = 10): Promise<ReturnsPaginated> {
  const { data } = await api.get<ReturnsPaginated>("/returns", { params: { page, limit } });
  return data;
}

export async function getMyReturnDetail(returnId: string): Promise<ReturnDetail> {
  const { data } = await api.get<ReturnDetail>(`/returns/${returnId}`);
  return data;
}

export async function requestReturnReview(returnId: string, reason: string): Promise<ReturnDetail> {
  const { data } = await api.post<ReturnDetail>(`/returns/${returnId}/review`, { reason });
  return data;
}
