// Espejo de PublicCompanyProfileResponse / PublicCompanyProductsResponse
// (backend > app/schemas/SchemaPublic.py).
import type { PublicProductCard } from "@/features/public/home/types/response";

export interface PublicCompanyProfile {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  created_at: string;
  total_products: number;
}

export interface PublicCompanyProductsResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  products: PublicProductCard[];
}

// Espejo de CompanyRatingResponse (backend > SchemaPublic.py) - la
// empresa no tiene reseñas propias, esto es la agregación de las
// reseñas activas de todos sus productos (ver ALCANCE > Calificaciones
// de empresa).
export interface CompanyRating {
  average_rating: number | null;
  total_reviews: number;
}
