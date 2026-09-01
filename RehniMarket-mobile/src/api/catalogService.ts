import { api } from "./client";

import type { PublicCatalog } from "@/types/catalog";

export async function getCatalogs(): Promise<PublicCatalog[]> {
  const { data } = await api.get<PublicCatalog[]>("/public/catalogs");
  return data;
}
