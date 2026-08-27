// Estados posibles del certificado de la empresa (espejo de
// CompanyCertificateEnum en el backend).
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

// Solo datos reales calculados sobre los productos de la empresa (ver
// ALCANCE > Home > ESTADÍSTICAS) - no hay ventas/ingresos/visitas.
export interface ProductsSummaryResponse {
total: number;
active: number;
hidden: number;
out_of_stock: number;
}

// Solo información PÚBLICA de la tienda - nombre/correo de la cuenta se
// consultan con GET /auth/me (ver "Configuración de cuenta"), no aquí.
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

export interface SpecificationResponse {
id: string;
name: string;
type: string;
required: boolean;
}

export interface ColorResponse {
id: string;
name: string;
hex_color: string;
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
// null = nunca eliminado (activo o solo desactivado con el toggle).
// Con fecha = eliminado por la empresa - distingue "Inactivo" de
// "Eliminado" (ver backend > ModelProduct.py > Product.deleted_at).
deleted_at: string | null;
}

export interface MyProductsPaginationResponse {
page: number;
limit: number;
total: number;
total_pages: number;
products: MyProductResponse[];
}

export interface ProductImageResponse {
id: string;
url: string;
is_main: boolean;
}

export interface ProductSpecificationResponse {
id: string;
specification_template_id: string;
value: string;
}

export interface ProductColorResponse {
id: string;
name: string;
hex_color: string;
}

export interface ProductDetailResponse {
id: string;
name: string;
// Pydantic serializa Decimal como string en JSON (verificado contra la
// respuesta real del backend), no como number.
price: string;
discount_enable: boolean;
discount_value: string;
stock: number;
has_variants: boolean;
descripcion: string;
is_active: boolean;
created_at: string;
deleted_at: string | null;
catalog_id: string;
catalog_name: string;
main_color_id: string | null;
main_color: ProductColorResponse | null;
images: ProductImageResponse[];
specifications: ProductSpecificationResponse[];
}

// ==========================
// VARIANTES
// ==========================

export interface VariantColorResponse {
id: string;
name: string;
hex_color: string;
}

export interface VariantImageResponse {
id: string;
url: string;
is_main: boolean;
}

export interface VariantSpecificationResponse {
id: string;
specification_template_id: string;
value: string;
}

export interface VariantResponse {
id: string;
name: string;
// Pydantic serializa Decimal como string en JSON.
price: string;
// Descuento propio de la variante (independiente del producto base).
// discount_value es un porcentaje (0-100), no un monto en pesos.
discount_enable: boolean;
discount_value: string;
stock: number;
product_id: string;
color: VariantColorResponse | null;
main_image_url: string | null;
}

export interface VariantDetailResponse extends VariantResponse {
images: VariantImageResponse[];
specifications: VariantSpecificationResponse[];
}
