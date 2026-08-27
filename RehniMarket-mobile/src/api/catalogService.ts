import { api } from "./client";

import type { PublicCatalog } from "@/types/catalog";

// Mismo endpoint que RehniMarket-frontend/src/features/public/products/
// api/productsService.ts > getCatalogs (GET /public/catalogs). Backend ya
// devuelve solo categorías activas, ordenadas por display_order ASC (ver
// publicService/Products.py > get_catalogs_service).
export async function getCatalogs(): Promise<PublicCatalog[]> {
  const { data } = await api.get<PublicCatalog[]>("/public/catalogs");
  return data;
}
