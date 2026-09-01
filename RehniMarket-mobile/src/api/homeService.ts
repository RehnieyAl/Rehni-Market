import { api } from "./client";

import type { PublicProductCard } from "@/types/product";

export interface PublicAdvertisement {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  button_link: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
}

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
