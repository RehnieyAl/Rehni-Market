export interface UpdateAdminUserRequest {
  email?: string;
  // "owner" solo puede asignarlo otro owner; el backend rechaza (403) lo demás.
  role?: "user" | "admin" | "owner";
}

export interface CreateCatalogRequest {
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  // Opcional: una categoría puede crearse sin imagen y agregársela después.
  image?: File;
}

// PATCH parcial: un campo ausente (undefined) significa "no tocar".
export interface UpdateCatalogRequest {
  name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  image?: File;
  // Elimina la imagen actual sin subir una nueva.
  remove_image?: boolean;
}

export interface CreateColorRequest {
  name: string;
  hex_color: string;
}

export interface UpdateColorRequest {
  name: string;
  hex_color: string;
}

export interface CreateSpecificationRequest {
  name: string;
  type: string;
  required: boolean;
}

export interface UpdateSpecificationRequest {
  name: string;
  type: string;
  required: boolean;
}

// Espejo de AdvertisementTargetType. undefined = anuncio manual clásico (button_link a mano).
export type AdvertisementTargetType =
  | "PRODUCT"
  | "CATEGORY"
  | "COMPANY"
  | "PROMOTION"
  | "BLACK_FRIDAY"
  | "CYBER_DAYS"
  | "LIQUIDATION"
  | "NEW_RELEASE";

// Campos del target dinámico, compartidos por Create/Update.
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
  title: string;
  description?: string;
  button_text?: string;
  // Solo se usa sin target_type; con uno, el backend calcula el destino.
  button_link?: string;
  order: number;
  is_active: boolean;
  // Desktop/tablet, obligatoria al crear
  image: File;
  // Móvil, opcional
  mobile_image?: File;
}

// PATCH parcial: un campo ausente (undefined) = "no tocar". Las imágenes ausentes se conservan.
export interface UpdateAdvertisementRequest extends AdvertisementTargetFields {
  title?: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  order?: number;
  is_active?: boolean;
  image?: File;
  mobile_image?: File;
  // Elimina la imagen móvil actual; se ignora si llega una nueva.
  remove_mobile_image?: boolean;
  // Vuelve el anuncio a manual clásico (un target_type ausente sería ambiguo).
  clear_target?: boolean;
}