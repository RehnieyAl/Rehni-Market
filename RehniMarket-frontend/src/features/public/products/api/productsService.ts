import { api } from "@/api/Client";

import type { PublicCatalog, PublicProductDetail } from "../types/response";

export async function getPublicProductDetail(
  productId: string,
): Promise<PublicProductDetail> {
  const { data } = await api.get<PublicProductDetail>(`/public/products/${productId}`);

  return data;
}

// Reutiliza el endpoint público de catálogos (ya usado por el dashboard
// company/admin bajo otro service) para poblar el filtro de categoría del
// listado público de productos.
export async function getCatalogs(): Promise<PublicCatalog[]> {
  const { data } = await api.get<PublicCatalog[]>("/public/catalogs");

  return data;
}
