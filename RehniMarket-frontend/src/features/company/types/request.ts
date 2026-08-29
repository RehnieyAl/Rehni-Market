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
// String crudo mientras se escribe; la conversión a número ocurre al enviar. Nunca NaN.
priceProduct: string;
stockProduct: string;
descripcionProduct: string;
technicalSpecProduct: ProductSpecification[];
imagesProduct: ProductImage[];
// Color principal del producto (opcional), independiente del color de las variantes.
mainColorId?: string;
}

export interface ChangeProductStatus {
is_active: boolean;
}

// PATCH parcial: un campo ausente (undefined) = "no tocar".
export interface UpdateProductRequest {
nameProduct?: string;
catalogId?: string;
priceProduct?: number;
discountEnable?: boolean;
discountValue?: number;
stockProduct?: number;
descripcionProduct?: string;
// mainColorId ausente = no tocar; con id = asignar; clearMainColor=true = quitar.
mainColorId?: string;
clearMainColor?: boolean;
technicalSpecProduct?: ProductSpecification[];
// Imagenes existentes a eliminar (por id) e imagenes nuevas a subir.
imagesToDeleted?: string[];
imagesProduct?: File[];
// Id de una imagen YA EXISTENTE que debe pasar a ser la principal.
mainImageId?: string;
}

export interface VariantImage {
file: File;
preview: string;
}

export interface CreateVariantRequest {
name: string;
// String crudo mientras se escribe; la conversión a número ocurre al enviar. Nunca NaN.
price: string;
stock: string;
// Obligatorio: cada variante tiene un color.
colorId: string;
specifications: ProductSpecification[];
images: VariantImage[];
}

// PATCH parcial: un campo ausente (undefined) = "no tocar". Imágenes y especificaciones aparte.
export interface UpdateVariantRequest {
name?: string;
price?: number;
// Descuento propio de la variante; discountValue es un porcentaje (0-100).
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
