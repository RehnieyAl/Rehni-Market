export interface UpdateAdminUserRequest {
  email?: string;
  // "owner" solo debe enviarse cuando quien realiza la petición es owner;
  // el backend rechaza (403) cualquier intento de asignarlo desde admin.
  role?: "user" | "admin" | "owner";
}


export interface CreateCatalogRequest {
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  // Opcional - una categoría puede crearse sin imagen (mismo criterio
  // que anuncios) y agregársela después con updateAdminCatalog.
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


// Espejo de AdvertisementTargetType (backend >
// app/models/ModelAdvertisement.py) - ver ALCANCE > Anuncios dinámicos
// por reglas. `undefined`/ausente = anuncio manual clásico (button_link
// se escribe a mano, comportamiento anterior sin cambios).
export type AdvertisementTargetType =
  | "PRODUCT"
  | "CATEGORY"
  | "COMPANY"
  | "PROMOTION"
  | "BLACK_FRIDAY"
  | "CYBER_DAYS"
  | "LIQUIDATION"
  | "NEW_RELEASE";

// Campos compartidos por Create/Update para el target dinámico - un solo
// lugar para no repetir la lista en los dos interfaces de abajo.
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
  // Solo se usa cuando target_type no está seteado (anuncio manual
  // clásico) - con un target_type, el backend calcula el destino real.
  button_link?: string;
  order: number;
  is_active: boolean;
  // Desktop/tablet - obligatoria al crear
  image: File;
  // Mobile - opcional
  mobile_image?: File;
}

// PATCH parcial: un campo ausente (undefined) significa "no tocar". Las
// imagenes son opcionales - si no se envian, se conservan las actuales.
export interface UpdateAdvertisementRequest extends AdvertisementTargetFields {
  title?: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  order?: number;
  is_active?: boolean;
  image?: File;
  mobile_image?: File;
  // Elimina la imagen movil actual sin subir una nueva. Se ignora si
  // mobile_image tambien se envia en el mismo request.
  remove_mobile_image?: boolean;
  // Vuelve el anuncio a manual clásico (limpia target_type y toda su
  // configuración) - mismo motivo que remove_mobile_image: un
  // target_type ausente es ambiguo entre "no lo toques" y "bórralo" (ver
  // backend > AdvertisementService.py).
  clear_target?: boolean;
}