import { api } from "@/api/Client";

import type { PublicAdvertisement, PublicProductCard } from "../types/response";

export async function getActiveAdvertisements(): Promise<PublicAdvertisement[]> {
  const { data } = await api.get<PublicAdvertisement[]>("/public/advertisements");

  return data;
}

export async function getDailyProducts(limit = 8): Promise<PublicProductCard[]> {
  const { data } = await api.get<PublicProductCard[]>("/public/products/daily", {
    params: { limit },
  });

  return data;
}
