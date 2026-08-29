import type { AttributeValueInput } from "./catalogAttributes";

// Solo información pública de la tienda; el nombre/correo de la cuenta van por PATCH /auth/me.
export interface UpdateProfileRequest {
  nameCompany?: string;
  addressCompany?: string;
  tellCompany?: string;
  description?: string;
}

export interface CompanyMediaUpload {
  photo_profile?: File;
  banner_profile?: File;
}

// El producto padre solo lleva identidad + especificaciones. Precio, stock, SKU,
// descuento e imágenes son de la variante.
export interface CreateProductRequest {
  nameProduct: string;
  catalogId: string;
  descripcionProduct: string;
  // Valores de atributos role="product" del catálogo (especificaciones).
  productAttributes: AttributeValueInput[];
}

export interface ChangeProductStatus {
  is_active: boolean;
}

// PATCH parcial: un campo ausente (undefined) = "no tocar".
export interface UpdateProductRequest {
  nameProduct?: string;
  catalogId?: string;
  descripcionProduct?: string;
  productAttributes?: AttributeValueInput[];
}

export type DiscountType = "percent" | "fixed";

// Descuento de cada variante.
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

// POST /company/dashboard/products/{pid}/variants (JSON).
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

// PATCH parcial de una variante: un campo ausente = "no tocar".
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
