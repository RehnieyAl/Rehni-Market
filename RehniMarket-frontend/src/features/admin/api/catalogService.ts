import { api } from "@/api/Client";

import type {
  AdminCatalogResponse,
  AdminSpecificationResponse,
} from "../types/response";

import type {
  CreateCatalogRequest,
  UpdateCatalogRequest,
  CreateSpecificationRequest,
  UpdateSpecificationRequest,
} from "../types/request";

export async function getAdminCatalogs(): Promise<AdminCatalogResponse[]> {
  const response = await api.get<AdminCatalogResponse[]>(
    "/admin/dashboard/get-catalogs",
  );

  return response.data;
}

// multipart/form-data (mismo criterio que advertisementService.ts) - la
// imagen viaja como archivo, no puede ir en JSON.
export async function createAdminCatalog(
  data: CreateCatalogRequest,
): Promise<AdminCatalogResponse> {
  const formData = new FormData();

  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.display_order != null) formData.append("display_order", data.display_order.toString());
  if (data.is_active != null) formData.append("is_active", data.is_active.toString());
  if (data.image) formData.append("image", data.image);

  const response = await api.post<AdminCatalogResponse>(
    "/admin/dashboard/created-catalogs",
    formData,
  );

  return response.data;
}

export async function updateAdminCatalog(
  catalogId: string,
  data: UpdateCatalogRequest,
): Promise<AdminCatalogResponse> {
  const formData = new FormData();

  if (data.name !== undefined) formData.append("name", data.name);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.display_order !== undefined) {
    formData.append("display_order", data.display_order.toString());
  }
  if (data.is_active !== undefined) formData.append("is_active", data.is_active.toString());
  if (data.image !== undefined) formData.append("image", data.image);
  if (data.remove_image !== undefined) {
    formData.append("remove_image", data.remove_image.toString());
  }

  const response = await api.put<AdminCatalogResponse>(
    `/admin/dashboard/update-catalogs/${catalogId}`,
    formData,
  );

  return response.data;
}

export async function changeAdminCatalogStatus(
  catalogId: string,
  isActive: boolean,
): Promise<AdminCatalogResponse> {
  const response = await api.patch<AdminCatalogResponse>(
    `/admin/dashboard/change-status-catalog/${catalogId}`,
    { is_active: isActive },
  );

  return response.data;
}

export async function deleteAdminCatalog(catalogId: string): Promise<void> {
  await api.delete(`/admin/dashboard/delete-catalogs/${catalogId}`);
}


export async function getAdminSpecifications(
  catalogId: string,
): Promise<AdminSpecificationResponse[]> {
  const response = await api.get<AdminSpecificationResponse[]>(
    `/admin/dashboard/get-specifications/${catalogId}`,
  );

  return response.data;
}

export async function createAdminSpecification(
  catalogId: string,
  data: CreateSpecificationRequest,
): Promise<AdminSpecificationResponse> {
  const response = await api.post<AdminSpecificationResponse>(
    `/admin/dashboard/created-specifications/${catalogId}`,
    data,
  );

  return response.data;
}

export async function updateAdminSpecification(
  specificationId: string,
  data: UpdateSpecificationRequest,
): Promise<AdminSpecificationResponse> {
  const response = await api.put<AdminSpecificationResponse>(
    `/admin/dashboard/update-specifications/${specificationId}`,
    data,
  );

  return response.data;
}

export async function deleteAdminSpecification(
  specificationId: string,
): Promise<void> {
  await api.delete(`/admin/dashboard/delete-specifications/${specificationId}`);
}
