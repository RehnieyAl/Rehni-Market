import { api } from "@/api/Client";

import type { Order, OrdersPaginated, OrderStatusCounts } from "@/features/orders/types/response";

export interface ActiveShippingCarrier {
  id: string;
  name: string;
}

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

export async function getActiveShippingCarriers(): Promise<ActiveShippingCarrier[]> {
  const { data } = await api.get<ActiveShippingCarrier[]>("/company/dashboard/shipping-carriers");
  return data;
}

export async function updateCompanyOrderShipping(
  orderId: string,
  shippingCarrierId: string,
  trackingNumber: string,
): Promise<Order> {
  const { data } = await api.patch<Order>(`/company/dashboard/orders/${orderId}/shipping`, {
    shippingCarrierId,
    trackingNumber,
  });
  return data;
}
