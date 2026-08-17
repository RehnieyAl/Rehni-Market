import { api } from "@/api/Client";

import type { Order } from "@/features/orders/types/response";
import type { CheckoutRequest } from "../types/request";

export interface CheckoutSummary {
  orders: Order[];
  subtotal: string;
  tax: string;
  total: string;
  walletBalance: string;
}

export async function checkout(payload: CheckoutRequest): Promise<CheckoutSummary> {
  const { data } = await api.post<CheckoutSummary>("/checkout", payload);
  return data;
}
