import type { AttributeValueInput } from "./catalogAttributes";

export interface UpdateProfileRequest {
  nameCompany?: string;
  addressCompany?: string;
  description?: string;
}

export interface CompanyMediaUpload {
  photo_profile?: File;
  banner_profile?: File;
}

export interface CreateProductRequest {
  nameProduct: string;
  catalogId: string;
  descripcionProduct: string;
  appliesTax: boolean;
  productAttributes: AttributeValueInput[];
}

export interface ChangeProductStatus {
  is_active: boolean;
}

export interface UpdateProductRequest {
  nameProduct?: string;
  catalogId?: string;
  descripcionProduct?: string;
  appliesTax?: boolean;
  productAttributes?: AttributeValueInput[];
}

export type DiscountType = "percent" | "fixed";

export interface DiscountInput {
  discount_enable: boolean;
  discount_value: number;
  discount_type: DiscountType | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}

export interface VariantImage {
  file: File;
  preview: string;
}

export interface CreateVariantRequest {
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  option_ids: string[];
  attribute_values: { attribute_id: string; value: string }[];
  discount_enable: boolean;
  discount_value: number;
  discount_type: DiscountType | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}

export interface UpdateVariantRequest {
  name?: string;
  sku?: string | null;
  price?: number;
  stock?: number;
  option_ids?: string[];
  attribute_values?: { attribute_id: string; value: string }[];
  discount_enable?: boolean;
  discount_value?: number;
  discount_type?: DiscountType | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
}
