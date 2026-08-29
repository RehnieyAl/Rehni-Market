import type { PublicProductCard } from "@/features/public/home/types/response";

// Espejo de CatalogResponse; usado por el filtro de categoría y la página Categorías.
export interface PublicCatalog {
  id: string;
  name: string;
  // Calculado en el backend, no hardcodeado.
  product_count: number;
  image_url: string | null;
}

// Espejo de PublicProductsPaginatedResponse: catálogo público con filtros (GET /public/products).
export interface PublicProductsPaginated {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  products: PublicProductCard[];
}

// Filtros de GET /public/products; todos opcionales.
export interface PublicProductsFilters {
  search?: string;
  catalogId?: string;
  minPrice?: number;
  maxPrice?: number;
  discount?: boolean;
  inStock?: boolean;
  // Alimentados por los anuncios dinámicos y por la URL de /products.
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

export interface PublicProductSpecification {
  name: string;
  value: string;
}

export interface PublicProductColor {
  name: string;
  hex_color: string;
}

export interface PublicProductVariant {
  id: string;
  name: string;
  // Pydantic serializa Decimal como string en JSON.
  price: string;
  // Descuento propio de la variante, independiente del descuento del
  // producto base.
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  stock: number;
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
}

// Conteo de reseñas activas por puntaje.
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
  // Id del catálogo, para pedir "Productos relacionados".
  catalog_id: string;
  company_name: string;
  // Datos mínimos de la empresa para el bloque "Vendido por".
  company_id: string;
  company_logo: string | null;
  company_is_verified: boolean;
  is_active: boolean;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  stock: number;
  // average_rating es null cuando review_count es 0, nunca 0.
  average_rating: number | null;
  review_count: number;
  rating_distribution: PublicRatingDistribution;
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
  variants: PublicProductVariant[];
}
