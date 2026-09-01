import { api } from "./client";

import type { Favorite } from "@/types/favorite";

export async function getFavorites(): Promise<Favorite[]> {
  const { data } = await api.get<Favorite[]>("/favorites");
  return data;
}

export async function addFavorite(productId: string): Promise<void> {
  await api.post("/favorites", { productId });
}

export async function removeFavorite(productId: string): Promise<void> {
  await api.delete(`/favorites/${productId}`);
}
