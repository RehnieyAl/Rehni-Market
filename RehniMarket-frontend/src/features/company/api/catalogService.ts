import { api } from "@/api/Client";
import type { CatalogResponse } from "../types/response";
import type { CatalogAttributes } from "../types/catalogAttributes";

export async function getCatalogs() {
  const { data } = await api.get<CatalogResponse[]>("/public/catalogs");
  return data;
}

export async function getCatalogAttributes(catalogId: string): Promise<CatalogAttributes> {
  const { data } = await api.get<CatalogAttributes>(
    `/public/catalogs/${catalogId}/attributes`,
  );
  return data;
}
