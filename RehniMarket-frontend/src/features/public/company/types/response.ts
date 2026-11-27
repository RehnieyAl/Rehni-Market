/** Contratos de /public/company/* y /company-follows/* (mismos nombres que los esquemas del backend). */
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
  /** Contacto comercial que la empresa autorizó publicar; null si no lo autorizó o no lo registró. */
  contact_email: string | null;
  contact_phone: string | null;
}

export interface PublicCompanyProductsResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  products: PublicProductCard[];
}

export interface CompanyRating {
  average_rating: number | null;
  total_reviews: number;
}

export interface CompanyFollowers {
  company_id: string;
  followers_count: number;
}

export interface CompanyFollowStatus extends CompanyFollowers {
  is_following: boolean;
}
