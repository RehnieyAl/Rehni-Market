export interface UpdateAdminUserRequest {
  email?: string;
  role?: "user" | "admin" | "owner";
}

export interface CreateCatalogRequest {
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  image?: File;
}

export interface UpdateCatalogRequest {
  name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  image?: File;
  remove_image?: boolean;
}

export interface CreateCatalogAttributeRequest {
  name: string;
  role: "product" | "variant";
  input_type: "select" | "color" | "text" | "number";
  unit?: string | null;
  position?: number;
}

export interface UpdateCatalogAttributeRequest {
  name?: string;
  role?: "product" | "variant";
  input_type?: "select" | "color" | "text" | "number";
  unit?: string | null;
  position?: number;
}

export interface CreateAttributeOptionRequest {
  value: string;
  hex_color?: string | null;
  position?: number;
}

export interface UpdateAttributeOptionRequest {
  value?: string;
  hex_color?: string | null;
  position?: number;
}

export type AdvertisementTargetType =
  | "PRODUCT"
  | "CATEGORY"
  | "COMPANY"
  | "PROMOTION"
  | "BLACK_FRIDAY"
  | "CYBER_DAYS"
  | "LIQUIDATION"
  | "NEW_RELEASE";

interface AdvertisementTargetFields {
  target_type?: AdvertisementTargetType;
  target_product_id?: string;
  target_catalog_id?: string;
  target_company_id?: string;
  minimum_discount?: number;
  maximum_stock?: number;
  max_age_days?: number;
}

export interface CreateAdvertisementRequest extends AdvertisementTargetFields {
  button_link?: string;
  order: number;
  is_active: boolean;
  image: File;
  mobile_image?: File;
}

export interface UpdateAdvertisementRequest extends AdvertisementTargetFields {
  button_link?: string;
  order?: number;
  is_active?: boolean;
  image?: File;
  mobile_image?: File;
  remove_mobile_image?: boolean;
  clear_target?: boolean;
}