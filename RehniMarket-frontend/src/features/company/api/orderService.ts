import { api } from "@/api/Client";

import type { Order, OrdersPaginated, OrderStatusCounts } from "@/features/orders/types/response";

// Pedidos RECIBIDOS por la empresa. El lado comprador vive en
// features/orders/api/orderService.ts.
//
// `statuses`: varios estados a la vez (para las pestañas
// Pendientes/En proceso/Completados, ver Orders.tsx). FastAPI espera
// parametros repetidos en texto plano (?status=pending&status=paid) para
// `status: list[str] = Query(None)` - el serializador por defecto de
// axios convierte un array en `status[]=pending&status[]=paid`
// (verificado), que FastAPI NO reconoce como el mismo parametro. Se
// arma un URLSearchParams a mano para forzar el formato que el backend
// realmente espera.
export async function getCompanyOrders(
  page = 1,
  limit = 10,
  statuses?: string[],
  search?: string,
): Promise<OrdersPaginated> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  for (const status of statuses ?? []) {
    params.append("status", status);
  }

  if (search) {
    params.set("search", search);
  }

  const { data } = await api.get<OrdersPaginated>("/company/dashboard/orders", { params });
  return data;
}

export async function getCompanyOrderStatusCounts(): Promise<OrderStatusCounts> {
  const { data } = await api.get<OrderStatusCounts>("/company/dashboard/orders/status-counts");
  return data;
}

export async function getCompanyOrderDetail(orderId: string): Promise<Order> {
  const { data } = await api.get<Order>(`/company/dashboard/orders/${orderId}`);
  return data;
}

export async function updateCompanyOrderStatus(orderId: string, status: string): Promise<Order> {
  const { data } = await api.patch<Order>(`/company/dashboard/orders/${orderId}/status`, {
    status,
  });
  return data;
}
