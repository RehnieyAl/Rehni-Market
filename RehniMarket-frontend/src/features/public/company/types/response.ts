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

export interface CompanyRating {
  average_rating: number | null;
  total_reviews: number;
}
