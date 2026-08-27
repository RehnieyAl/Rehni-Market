import type { PublicProductCard } from "@/features/public/home/types/response";

// Espejo de CatalogResponse (backend > app/schemas/SchemaPublic.py),
// reutilizado para el filtro de categoría del listado público y para la
// página pública Categorías (ver features/public/categories).
export interface PublicCatalog {
  id: string;
  name: string;
  // Datos reales calculados en el backend (get_catalogs_service), no
  // hardcodeados en el frontend.
  product_count: number;
  image_url: string | null;
}

// Espejo de PublicProductsPaginatedResponse (backend > SchemaPublic.py) -
// catálogo público completo con filtros (GET /public/products).
export interface PublicProductsPaginated {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  products: PublicProductCard[];
}

// Filtros soportados por GET /public/products (ver
// app/routers/publicRouters.py). Todos opcionales.
export interface PublicProductsFilters {
  search?: string;
  catalogId?: string;
  minPrice?: number;
  maxPrice?: number;
  discount?: boolean;
  inStock?: boolean;
  // Alimentados por los anuncios dinámicos por reglas (ver ALCANCE >
  // Anuncios dinámicos) además de por la propia URL de /products - mismos
  // parámetros reales que ya lee ProductsList.tsx.
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

// Conteo real de reseñas activas por puntaje (ver ALCANCE > rediseño
// detalle de producto, panel "Opiniones de compradores" - espejo de
// PublicRatingDistributionResponse en SchemaPublic.py).
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
  // Id real del catálogo - se usa para pedir "Productos relacionados"
  // (GET /public/products?catalog=, ver RelatedProducts.tsx).
  catalog_id: string;
  company_name: string;
  // Datos minimos de la empresa para el bloque "Vendido por" (ver
  // ProductDetail.tsx > "Ver perfil de empresa").
  company_id: string;
  company_logo: string | null;
  company_is_verified: boolean;
  is_active: boolean;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  stock: number;
  // Resumen real de reseñas (ver ReviewsSection.tsx) - average_rating es
  // null cuando review_count es 0, nunca 0 falso.
  average_rating: number | null;
  review_count: number;
  rating_distribution: PublicRatingDistribution;
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
  variants: PublicProductVariant[];
}
