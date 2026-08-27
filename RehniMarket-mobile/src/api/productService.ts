import { api } from "./client";

import type { PublicProductDetail } from "@/types/product";

// Servicio real de producto (ver Fase Product Detail > API, "usar
// src/api/productService.ts, si no tiene el método necesario agregarlo
// ahí" - no existía todavía, homeService.ts/catalogService.ts son otros
// recursos). Mismo endpoint que RehniMarket-frontend/src/features/public/
// products/api/productsService.ts > getPublicProductDetail (GET
// /public/products/{id}, ver publicRouters.py). 404 real
// (ErrorCode.PRODUCT_NOT_FOUND) cuando el producto no existe o no es
// públicamente visible (ver publicService/Products.py >
// get_public_product_detail_service) - se deja propagar el error tal
// cual, cada pantalla decide cómo mostrarlo (ver api/apiError.ts).
export async function getProductDetail(productId: string): Promise<PublicProductDetail> {
  const { data } = await api.get<PublicProductDetail>(`/public/products/${productId}`);
  return data;
}
