import { api } from "@/api/Client";

import type { Favorite } from "../types/response";

export async function getFavorites(): Promise<Favorite[]> {
  const { data } = await api.get<Favorite[]>("/favorites");
  return data;
}

export async function addFavorite(productId: string): Promise<{ message: string }> {
  const { data } = await api.post("/favorites", { productId });
  return data;
}

export async function removeFavorite(productId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/favorites/${productId}`);
  return data;
}
