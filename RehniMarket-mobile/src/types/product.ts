export interface PublicProductCard {
  id: string;
  name: string;
  image: string | null;
  company_name: string;
  catalog_id: string;
  catalog_name: string;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  stock: number;
  average_rating: number | null;
  review_count: number;
}

export interface PublicProductsPaginated {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  products: PublicProductCard[];
}

export type PublicProductsSort = "relevance" | "price_asc" | "price_desc" | "discount";

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
  sort?: PublicProductsSort;
  page?: number;
  limit?: number;
}

export interface PublicProductImage {
  id: string;
  url: string;
  is_main: boolean;
}

export interface PublicProductSpecification {
  name: string;
  value: string;
}

export interface PublicProductColor {
  name: string;
  hex_color: string;
}

export interface PublicVariantOption {
  attribute: string;
  value: string;
  hex_color: string | null;
}

export interface PublicProductVariant {
  id: string;
  name: string;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  applies_tax: boolean;
  tax_amount: string;
  final_price_with_tax: string;
  stock: number;
  options: PublicVariantOption[];
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
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
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
  variants: PublicProductVariant[];
}
