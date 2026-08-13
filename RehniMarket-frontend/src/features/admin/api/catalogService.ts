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

export async function createAdminCatalog(
  data: CreateCatalogRequest,
): Promise<AdminCatalogResponse> {
  const response = await api.post<AdminCatalogResponse>(
    "/admin/dashboard/created-catalogs",
    data,
  );

  return response.data;
}

export async function updateAdminCatalog(
  catalogId: string,
  data: UpdateCatalogRequest,
): Promise<AdminCatalogResponse> {
  const response = await api.put<AdminCatalogResponse>(
    `/admin/dashboard/update-catalogs/${catalogId}`,
    data,
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
