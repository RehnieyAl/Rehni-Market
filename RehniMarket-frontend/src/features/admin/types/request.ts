export interface UpdateAdminUserRequest {
  email?: string;
  // "owner" solo debe enviarse cuando quien realiza la petición es owner;
  // el backend rechaza (403) cualquier intento de asignarlo desde admin.
  role?: "user" | "admin" | "owner";
}


export interface CreateCatalogRequest {
  name: string;
}

export interface UpdateCatalogRequest {
  name: string;
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


export interface CreateAdvertisementRequest {
  title: string;
  description?: string;
  button_text?: string;
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
export interface UpdateAdvertisementRequest {
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
}