export type CompanyCertificateStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_update";

export interface DashboardHomeResponse {
  id: string;
  logo: string | null;
  banner: string | null;
  nameCompany: string;
  addressCompany: string;
  description: string | null;
  certificate_status: CompanyCertificateStatus;
  rejection_reason: string | null;
  is_verified: boolean;
  memberAT: string;
}

export interface ProductsSummaryResponse {
  total: number;
  active: number;
  hidden: number;
  out_of_stock: number;
}

export interface CompanyProfileResponse {
  id: string;
  nameCompany: string;
  addressCompany: string;
  description: string | null;
  CompanyNIT: string;
  CompanyNITDV: string;
  CompanyStatus: boolean;
  suspensionReason: string | null;
  certificateStatus: CompanyCertificateStatus;
  rejectionReason: string | null;
  memberAT: string;
  logo?: string;
  banner?: string;
}

export interface CatalogResponse {
  id: string;
  name: string;
}

export interface MyProductResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string | null;
  is_active: boolean;
  deleted_at: string | null;
}

export interface MyProductsPaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  products: MyProductResponse[];
}

export interface ProductAttributePair {
  attribute_id: string;
  attribute_name: string;
  value: string;
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  applies_tax: boolean;
  has_variants: boolean;
  descripcion: string;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
  catalog_id: string;
  catalog_name: string;
  attributes: ProductAttributePair[];
}

export interface VariantImageResponse {
  id: string;
  url: string;
  is_main: boolean;
}

export interface VariantOptionPair {
  attribute_id: string;
  attribute_name: string;
  option_id: string;
  value: string;
  hex_color: string | null;
}

export interface VariantAttributeValuePair {
  attribute_id: string;
  attribute_name: string;
  value: string;
}

export interface VariantResponse {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  stock: number;
  combo_key: string | null;
  deleted_at: string | null;
  discount_enable: boolean;
  discount_value: string;
  discount_type: string | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
  effective_price: string;
  discount_percentage: number | null;
  discount_source: string | null;
  product_id: string;
  options: VariantOptionPair[];
  main_image_url: string | null;
}

export interface VariantDetailResponse extends VariantResponse {
  images: VariantImageResponse[];
  attribute_values: VariantAttributeValuePair[];
}

export interface GeneratedCombination {
  options: VariantOptionPair[];
  combo_key: string;
  exists: boolean;
}
