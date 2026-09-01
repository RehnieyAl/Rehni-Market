import type { PublicProductCard } from "@/features/public/home/types/response";

export interface PublicCatalog {
  id: string;
  name: string;
  product_count: number;
  image_url: string | null;
}

export interface PublicProductsPaginated {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  products: PublicProductCard[];
}

export interface PublicProductsFilters {
  search?: string;
  catalogId?: string;
  minPrice?: number;
  maxPrice?: number;
  discount?: boolean;
  inStock?: boolean;
  minDiscount?: number;
  maxStock?: number;
  days?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "discount";
  page?: number;
  limit?: number;
}

export interface PublicProductImage {
  id: string;
  url: string;
  is_main: boolean;
}

export interface PublicAttributePair {
  attribute: string;
  value: string;
}

export interface PublicVariantOption extends PublicAttributePair {
  hex_color: string | null;
}

export interface PublicProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  applies_tax: boolean;
  tax_amount: string;
  final_price_with_tax: string;
  stock: number;
  options: PublicVariantOption[];
  images: PublicProductImage[];
}

export interface PublicCatalogAttributeOption {
  id: string;
  value: string;
  hex_color: string | null;
  position: number;
}

export interface PublicCatalogAttribute {
  id: string;
  name: string;
  input_type: "select" | "color" | "text" | "number";
  unit: string | null;
  position: number;
  options: PublicCatalogAttributeOption[];
}

export interface PublicCatalogAttributes {
  product_attributes: PublicCatalogAttribute[];
  variant_attributes: PublicCatalogAttribute[];
}

export interface PublicRatingDistribution {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}

export interface PublicProductDetail {
  id: string;
  name: string;
  descripcion: string;
  catalog_name: string;
  catalog_id: string;
  company_name: string;
  company_id: string;
  company_logo: string | null;
  company_is_verified: boolean;
  is_active: boolean;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  applies_tax: boolean;
  tax_rate: string;
  tax_amount: string;
  price_with_tax: string;
  stock: number;
  average_rating: number | null;
  review_count: number;
  rating_distribution: PublicRatingDistribution;
  images: PublicProductImage[];
  attributes: PublicAttributePair[];
  variants: PublicProductVariant[];
}
