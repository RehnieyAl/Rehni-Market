import { api } from "@/api/Client";

import type { AdminCatalogAttributeResponse } from "../types/response";

import type {
  CreateCatalogAttributeRequest,
  UpdateCatalogAttributeRequest,
  CreateAttributeOptionRequest,
  UpdateAttributeOptionRequest,
} from "../types/request";

// Sistema generico de atributos por catalogo (ver
// CatalogAttributeService.py). El Admin/Owner define, por categoria, que
// atributos existen, si son eje de variante (role="variant") o
// especificacion (role="spec"), y sus valores permitidos.

export async function getCatalogAttributes(
  catalogId: string,
): Promise<AdminCatalogAttributeResponse[]> {
  const { data } = await api.get<AdminCatalogAttributeResponse[]>(
    `/admin/dashboard/catalogs/${catalogId}/attributes`,
  );

  return data;
}

export async function createCatalogAttribute(
  catalogId: string,
  body: CreateCatalogAttributeRequest,
): Promise<AdminCatalogAttributeResponse> {
  const { data } = await api.post<AdminCatalogAttributeResponse>(
    `/admin/dashboard/catalogs/${catalogId}/attributes`,
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

export async function deleteCatalogAttribute(attributeId: string): Promise<void> {
  await api.delete(`/admin/dashboard/catalog-attributes/${attributeId}`);
}

export async function addAttributeOption(
  attributeId: string,
  body: CreateAttributeOptionRequest,
): Promise<AdminCatalogAttributeResponse> {
  const { data } = await api.post<AdminCatalogAttributeResponse>(
    `/admin/dashboard/catalog-attributes/${attributeId}/options`,
    body,
  );

  return data;
}

export async function updateAttributeOption(
  optionId: string,
  body: UpdateAttributeOptionRequest,
): Promise<AdminCatalogAttributeResponse> {
  const { data } = await api.patch<AdminCatalogAttributeResponse>(
    `/admin/dashboard/catalog-attribute-options/${optionId}`,
    body,
  );

  return data;
}

export async function deleteAttributeOption(
  optionId: string,
): Promise<AdminCatalogAttributeResponse> {
  const { data } = await api.delete<AdminCatalogAttributeResponse>(
    `/admin/dashboard/catalog-attribute-options/${optionId}`,
  );

  return data;
}
