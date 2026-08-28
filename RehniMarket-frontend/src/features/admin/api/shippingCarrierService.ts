import { api } from "@/api/Client";

import type { AdminShippingCarrierResponse } from "../types/response";

import type {
  CreateShippingCarrierRequest,
  UpdateShippingCarrierRequest,
} from "../types/request";

export async function getAdminShippingCarriers(): Promise<AdminShippingCarrierResponse[]> {
  const response = await api.get<AdminShippingCarrierResponse[]>(
    "/admin/dashboard/get-shipping-carriers",
  );

  return response.data;
}

export async function createAdminShippingCarrier(
  data: CreateShippingCarrierRequest,
): Promise<AdminShippingCarrierResponse> {
  const response = await api.post<AdminShippingCarrierResponse>(
    "/admin/dashboard/create-shipping-carrier",
    data,
  );

  return response.data;
}

export async function updateAdminShippingCarrier(
  carrierId: string,
  data: UpdateShippingCarrierRequest,
): Promise<AdminShippingCarrierResponse> {
  const response = await api.put<AdminShippingCarrierResponse>(
    `/admin/dashboard/update-shipping-carrier/${carrierId}`,
    data,
  );

  return response.data;
}

export async function changeAdminShippingCarrierStatus(
  carrierId: string,
  isActive: boolean,
): Promise<AdminShippingCarrierResponse> {
  const response = await api.patch<AdminShippingCarrierResponse>(
    `/admin/dashboard/change-status-shipping-carrier/${carrierId}`,
    { is_active: isActive },
  );

  return response.data;
}
