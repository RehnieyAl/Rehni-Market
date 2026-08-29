// Estados del certificado de la empresa (espejo de CompanyCertificateEnum).
export type CompanyCertificateStatus = "pending" | "approved" | "rejected";

export interface DashboardHomeResponse {
  id: string;
  logo: string | null;
  banner: string | null;
  nameCompany: string;
  addressCompany: string;
  description: string | null;
  certificate_status: CompanyCertificateStatus;
  is_verified: boolean;
  memberAT: string;
}

// Solo datos calculados sobre los productos; no hay ventas/ingresos/visitas.
export interface ProductsSummaryResponse {
  total: number;
  active: number;
  hidden: number;
  out_of_stock: number;
}

// Solo información pública de la tienda; el nombre/correo de la cuenta van por GET /auth/me.
export interface CompanyProfileResponse {
  id: string;
  nameCompany: string;
  addressCompany: string;
  description: string | null;
  tellCompany: string;
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
  // null = nunca eliminado; con fecha = eliminado por la empresa (distinto de "Inactivo").
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

// Identidad + especificaciones del producto padre. Precio, stock, descuento e
// imágenes son de la variante y no se editan aquí.
export interface ProductDetailResponse {
  id: string;
  name: string;
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
  // Pydantic serializa Decimal como string en JSON.
  price: string;
  stock: number;
  combo_key: string | null;
  deleted_at: string | null;
  // Descuento propio de la variante.
  discount_enable: boolean;
  discount_value: string;
  discount_type: string | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
  // Precio efectivo resuelto por el backend (variante → producto → normal).
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

// POST /company/dashboard/products/{pid}/variants/generate
export interface GeneratedCombination {
  options: VariantOptionPair[];
  combo_key: string;
  exists: boolean;
}
