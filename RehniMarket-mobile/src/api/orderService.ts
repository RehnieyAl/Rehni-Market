import { api } from "./client";

import type { Order, OrdersPaginated } from "@/types/order";

export async function getMyOrders(page = 1, limit = 10): Promise<OrdersPaginated> {
  const { data } = await api.get<OrdersPaginated>("/orders", { params: { page, limit } });
  return data;
}

export async function getMyOrderDetail(orderId: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${orderId}`);
  return data;
}

export async function cancelMyOrder(orderId: string): Promise<Order> {
  const { data } = await api.patch<Order>(`/orders/${orderId}/cancel`);
  return data;
}
