import { api } from "@/api/Client";

import type { AdminCatalogAttributeResponse } from "../types/response";
import type {
  CreateCatalogAttributeRequest,
  UpdateCatalogAttributeRequest,
  CreateAttributeOptionRequest,
  UpdateAttributeOptionRequest,
} from "../types/request";

// El Admin/Owner define, por categoría, qué atributos existen, si son de producto
// (role="product") o eje de variante (role="variant"), y sus opciones.

export async function getCatalogAttributes(
  catalogId: string,
): Promise<AdminCatalogAttributeResponse[]> {
  const { data } = await api.get<AdminCatalogAttributeResponse[]>(
    `/admin/dashboard/catalogs/${catalogId}/catalog-attributes`,
  );
  return data;
}

export async function createCatalogAttribute(
  catalogId: string,
  body: CreateCatalogAttributeRequest,
): Promise<AdminCatalogAttributeResponse> {
  const { data } = await api.post<AdminCatalogAttributeResponse>(
    `/admin/dashboard/catalogs/${catalogId}/catalog-attributes`,
    body,
  );
  return data;
}

export async function updateCatalogAttribute(
  attributeId: string,
  body: UpdateCatalogAttributeRequest,
): Promise<AdminCatalogAttributeResponse> {
  const { data } = await api.patch<AdminCatalogAttributeResponse>(
    `/admin/dashboard/catalog-attributes/${attributeId}`,
    body,
  );
  return data;
}

export async function setCatalogAttributeStatus(
  attributeId: string,
  isActive: boolean,
): Promise<AdminCatalogAttributeResponse> {
  const { data } = await api.patch<AdminCatalogAttributeResponse>(
    `/admin/dashboard/catalog-attributes/${attributeId}/status`,
    { is_active: isActive },
  );
  return data;
}

export async function deleteCatalogAttribute(attributeId: string): Promise<void> {
  await api.delete(`/admin/dashboard/catalog-attributes/${attributeId}`);
}

export async function addAttributeOption(
  attributeId: string,
  body: CreateAttributeOptionRequest,
): Promise<void> {
  await api.post(`/admin/dashboard/catalog-attributes/${attributeId}/options`, body);
}

export async function updateAttributeOption(
  optionId: string,
  body: UpdateAttributeOptionRequest,
): Promise<void> {
  await api.patch(`/admin/dashboard/catalog-attribute-options/${optionId}`, body);
}

export async function deleteAttributeOption(optionId: string): Promise<void> {
  await api.delete(`/admin/dashboard/catalog-attribute-options/${optionId}`);
}
