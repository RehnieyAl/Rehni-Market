// Espejo de RehniMarket-frontend/src/features/public/home/types/
// response.ts > PublicProductCard (backend: SchemaPublic.py >
// PublicProductCardResponse). Reutilizable en cualquier listado de
// productos (Home, Categorías, búsqueda, favoritos - ver Fase Home >
// PRODUCT CARD), no exclusivo de Home.
//
// price/final_price viajan como string (Pydantic serializa Decimal así) -
// nunca asumir number, convertir con Number() al operar.
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

// A partir de acá: espejo de RehniMarket-frontend/src/features/public/
// products/types/response.ts (backend: SchemaPublic.py) - contrato real
// de GET /public/products/{id}, ver Fase Product Detail.

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

// Variante real del producto (ProductVariant). Cada variante tiene
// exactamente un color (regla de negocio del backend - ver
// CreateVariantRequest) y su propio precio/descuento/stock, independiente
// del producto base (ver ModelVariant.py) - nunca se hereda del padre.
export interface PublicProductVariant {
  id: string;
  name: string;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  stock: number;
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
}

// Conteo real de reseñas activas por puntaje. Tipado por contrato aunque
// esta fase todavía no renderiza reseñas/rating (ver Fase Product Detail
// > NO IMPLEMENTAR TODAVÍA) - PublicProductDetail debe representar la
// respuesta real completa del backend, no un subconjunto recortado.
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
  // Stock del PRODUCTO BASE - engañoso cuando `variants.length > 0` (ver
  // ProductDetailScreen.tsx > REGLA DE STOCK): puede ser 0 aunque exista
  // una variante con stock. Nunca ocultar/deshabilitar variantes a partir
  // de este campo.
  stock: number;
  average_rating: number | null;
  review_count: number;
  rating_distribution: PublicRatingDistribution;
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
  variants: PublicProductVariant[];
}
