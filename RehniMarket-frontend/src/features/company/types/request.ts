export interface UpdateProfileRequest {
nameCompany: string;
emailCompany: string;
addressCompany: string;
tellCompany: string;
}

export interface CompanyMediaUpload {
photo_profile?: File;
banner_profile?: File;
}

export interface ProductSpecification {
specificationTemplateId: string;
value: string;
}

export interface ProductImage {
file: File;
preview: string;
isMain: boolean;
}

export interface CreateProductRequest {
nameProduct: string;
catalogId: string;
priceProduct: number | "";
stockProduct: number | "";
descripcionProduct: string;
technicalSpecProduct: ProductSpecification[];
imagesProduct: ProductImage[];
// Color principal del producto (opcional). Independiente del color de
// cada variante, que se gestiona por separado.
mainColorId?: string;
}

export interface ChangeProductStatus {
is_active: boolean;
}

// PATCH parcial: todos los campos son opcionales. Un campo ausente
// (undefined) significa "no tocar" - mismo contrato que
// UpdateProductRequest en el backend (SchemaProduct.py).
export interface UpdateProductRequest {
nameProduct?: string;
catalogId?: string;
priceProduct?: number;
discountEnable?: boolean;
discountValue?: number;
stockProduct?: number;
descripcionProduct?: string;
// mainColorId ausente -> no tocar. mainColorId con id -> asignar ese
// color. clearMainColor=true -> quitar el color principal.
mainColorId?: string;
clearMainColor?: boolean;
technicalSpecProduct?: ProductSpecification[];
// Imagenes existentes a eliminar (por id) e imagenes nuevas a subir.
imagesToDeleted?: string[];
imagesProduct?: File[];
// Id de una imagen YA EXISTENTE que debe pasar a ser la principal.
mainImageId?: string;
}

// ==========================
// VARIANTES
// ==========================

export interface VariantImage {
file: File;
preview: string;
}

export interface CreateVariantRequest {
name: string;
price: number | "";
stock: number | "";
// Obligatorio: cada variante debe tener exactamente un color.
colorId: string;
specifications: ProductSpecification[];
images: VariantImage[];
}

// PATCH parcial: un campo ausente (undefined) significa "no tocar". No
// incluye imagenes ni especificaciones - tienen su propio circuito (mismo
// contrato que UpdateVariantRequest en el backend, SchemaVariant.py).
export interface UpdateVariantRequest {
name?: string;
price?: number;
// Descuento propio de la variante. discountValue es un porcentaje
// (0-100), no un monto en pesos - igual que UpdateProductRequest.
discountEnable?: boolean;
discountValue?: number;
stock?: number;
colorId?: string;
}

export interface VariantSpecificationRequest {
specificationTemplateId: string;
value: string;
}

export interface VariantSpecificationUpdateRequest {
value: string;
}
