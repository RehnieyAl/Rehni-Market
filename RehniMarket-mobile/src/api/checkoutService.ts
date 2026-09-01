import { api } from "./client";

import type { CheckoutRequest, CheckoutSummary } from "@/types/checkout";

export async function checkout(payload: CheckoutRequest): Promise<CheckoutSummary> {
  const { data } = await api.post<CheckoutSummary>("/checkout", payload);
  return data;
}
