import { api } from "./client";

import type { PublicProductDetail } from "@/types/product";

export async function getProductDetail(productId: string): Promise<PublicProductDetail> {
  const { data } = await api.get<PublicProductDetail>(`/public/products/${productId}`);
  return data;
}
