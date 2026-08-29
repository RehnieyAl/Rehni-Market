import { api } from "@/api/Client";

import type { AdminAdvertisementResponse } from "../types/response";

import type {
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
} from "../types/request";

// Compartido por create/update -
// un solo lugar que sabe qué campos de target existen, en vez de repetir
// la lista de 7 campos en ambas funciones.
function appendTargetFields(
  formData: FormData,
  data: Partial<CreateAdvertisementRequest & UpdateAdvertisementRequest>,
) {
  if (data.target_type !== undefined) formData.append("target_type", data.target_type);
  if (data.target_product_id !== undefined) {
    formData.append("target_product_id", data.target_product_id);
  }
  if (data.target_catalog_id !== undefined) {
    formData.append("target_catalog_id", data.target_catalog_id);
  }
  if (data.target_company_id !== undefined) {
    formData.append("target_company_id", data.target_company_id);
  }
  if (data.minimum_discount !== undefined) {
    formData.append("minimum_discount", data.minimum_discount.toString());
  }
  if (data.maximum_stock !== undefined) {
    formData.append("maximum_stock", data.maximum_stock.toString());
  }
  if (data.max_age_days !== undefined) {
    formData.append("max_age_days", data.max_age_days.toString());
  }
}

export async function getAdminAdvertisements(): Promise<AdminAdvertisementResponse[]> {
  const response = await api.get<AdminAdvertisementResponse[]>(
    "/admin/dashboard/get-advertisements",
  );

  return response.data;
}

export async function createAdminAdvertisement(
  data: CreateAdvertisementRequest,
): Promise<AdminAdvertisementResponse> {
  const formData = new FormData();

  formData.append("title", data.title);
  if (data.description) formData.append("description", data.description);
  if (data.button_text) formData.append("button_text", data.button_text);
  if (data.button_link) formData.append("button_link", data.button_link);
  formData.append("order", data.order.toString());
  formData.append("is_active", data.is_active.toString());
  formData.append("image", data.image);
  if (data.mobile_image) formData.append("mobile_image", data.mobile_image);
  appendTargetFields(formData, data);

  const response = await api.post<AdminAdvertisementResponse>(
    "/admin/dashboard/create-advertisement",
    formData,
  );

  return response.data;
}

export async function updateAdminAdvertisement(
  advertisementId: string,
  data: UpdateAdvertisementRequest,
): Promise<AdminAdvertisementResponse> {
  const formData = new FormData();

  if (data.title !== undefined) formData.append("title", data.title);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.button_text !== undefined) formData.append("button_text", data.button_text);
  if (data.button_link !== undefined) formData.append("button_link", data.button_link);
  if (data.order !== undefined) formData.append("order", data.order.toString());
  if (data.is_active !== undefined) formData.append("is_active", data.is_active.toString());
  if (data.image !== undefined) formData.append("image", data.image);
  if (data.mobile_image !== undefined) formData.append("mobile_image", data.mobile_image);
  if (data.remove_mobile_image !== undefined) {
    formData.append("remove_mobile_image", data.remove_mobile_image.toString());
  }
  if (data.clear_target !== undefined) {
    formData.append("clear_target", data.clear_target.toString());
  }
  appendTargetFields(formData, data);

  const response = await api.patch<AdminAdvertisementResponse>(
    `/admin/dashboard/update-advertisement/${advertisementId}`,
    formData,
  );

  return response.data;
}

export async function changeAdminAdvertisementStatus(
  advertisementId: string,
  isActive: boolean,
): Promise<AdminAdvertisementResponse> {
  const response = await api.patch<AdminAdvertisementResponse>(
    `/admin/dashboard/change-status-advertisement/${advertisementId}`,
    { is_active: isActive },
  );

  return response.data;
}

export async function deleteAdminAdvertisement(advertisementId: string): Promise<void> {
  await api.delete(`/admin/dashboard/delete-advertisement/${advertisementId}`);
}
