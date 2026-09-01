import { api } from "@/api/Client";

import type { ShippingCarrier } from "../types/response";

export interface ShippingCarrierPayload {
  name: string;
  tracking_url: string;
  is_active: boolean;
}

const BASE = "/admin/dashboard/shipping-carriers";

export async function getShippingCarriers(): Promise<ShippingCarrier[]> {
  const { data } = await api.get<ShippingCarrier[]>(BASE);
  return data;
}

export async function createShippingCarrier(
  payload: ShippingCarrierPayload,
): Promise<ShippingCarrier> {
  const { data } = await api.post<ShippingCarrier>(BASE, payload);
  return data;
}

export async function updateShippingCarrier(
  carrierId: string,
  payload: ShippingCarrierPayload,
): Promise<ShippingCarrier> {
  const { data } = await api.put<ShippingCarrier>(`${BASE}/${carrierId}`, payload);
  return data;
}

export async function changeShippingCarrierStatus(
  carrierId: string,
  isActive: boolean,
): Promise<ShippingCarrier> {
  const { data } = await api.patch<ShippingCarrier>(`${BASE}/${carrierId}/status`, {
    is_active: isActive,
  });
  return data;
}
