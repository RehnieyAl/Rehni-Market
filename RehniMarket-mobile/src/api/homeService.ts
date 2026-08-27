import { api } from "./client";

import type { PublicProductCard } from "@/types/product";

// Espejo de RehniMarket-frontend/src/features/public/home/types/
// response.ts > PublicAdvertisement (backend: SchemaPublic.py >
// AdvertisementResponse). Exclusivo del banner de Home, por eso vive acá
// y no en src/types/ - nada más lo consume.
export interface PublicAdvertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  // Puede ser null - usar image_url como fallback (ver BannerCarousel.tsx).
  mobile_image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
}

// Mismos dos endpoints que RehniMarket-frontend/src/features/public/home/
// api/homeService.ts.
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
