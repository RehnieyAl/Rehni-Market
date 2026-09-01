import { api } from "./client";

import type { PublicProductsFilters, PublicProductsPaginated } from "@/types/product";

export async function getPublicProducts(
  filters: PublicProductsFilters = {},
): Promise<PublicProductsPaginated> {
  const params: Record<string, string | number> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 24,
  };

  if (filters.search) params.search = filters.search;
  if (filters.catalogId) params.catalog_id = filters.catalogId;
  if (filters.minPrice != null) params.min_price = filters.minPrice;
  if (filters.maxPrice != null) params.max_price = filters.maxPrice;
  if (filters.discount) params.discount = "true";
  if (filters.inStock) params.in_stock = "true";
  if (filters.minDiscount != null) params.min_discount = filters.minDiscount;
  if (filters.maxStock != null) params.max_stock = filters.maxStock;
  if (filters.days != null) params.days = filters.days;
  if (filters.sort && filters.sort !== "relevance") params.sort = filters.sort;

  const { data } = await api.get<PublicProductsPaginated>("/public/products", { params });
  return data;
}

export async function getPublicOffers(page = 1, limit = 24): Promise<PublicProductsPaginated> {
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
