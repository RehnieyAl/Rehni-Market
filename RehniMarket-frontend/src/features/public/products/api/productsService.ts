import { api } from "@/api/Client";

import type {
  PublicCatalog,
  PublicCatalogAttributes,
  PublicProductDetail,
  PublicProductsFilters,
  PublicProductsPaginated,
} from "../types/response";

export async function getPublicProductDetail(
  productId: string,
): Promise<PublicProductDetail> {
  const { data } = await api.get<PublicProductDetail>(`/public/products/${productId}`);

  return data;
}

export async function getCatalogAttributes(
  catalogId: string,
): Promise<PublicCatalogAttributes> {
  const { data } = await api.get<PublicCatalogAttributes>(
    `/public/catalogs/${catalogId}/attributes`,
  );

  return data;
}

export async function getCatalogs(): Promise<PublicCatalog[]> {
  const { data } = await api.get<PublicCatalog[]>("/public/catalogs");

  return data;
}

export async function getPublicProducts(
  filters: PublicProductsFilters = {},
): Promise<PublicProductsPaginated> {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.catalogId) params.set("catalog_id", filters.catalogId);
  if (filters.minPrice != null) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("max_price", String(filters.maxPrice));
  if (filters.discount) params.set("discount", "true");
  if (filters.inStock) params.set("in_stock", "true");
  if (filters.minDiscount != null) params.set("min_discount", String(filters.minDiscount));
  if (filters.maxStock != null) params.set("max_stock", String(filters.maxStock));
  if (filters.days != null) params.set("days", String(filters.days));
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 24));

  const { data } = await api.get<PublicProductsPaginated>("/public/products", { params });

  return data;
}

export async function getPublicOffers(
  page = 1,
  limit = 24,
): Promise<PublicProductsPaginated> {
  const { data } = await api.get<PublicProductsPaginated>("/public/products/offers", {
    params: { page, limit },
  });

  return data;
}

export async function getPublicNewProducts(
  page = 1,
  limit = 24,
): Promise<PublicProductsPaginated> {
  const { data } = await api.get<PublicProductsPaginated>("/public/products/new", {
    params: { page, limit },
  });

  return data;
}
