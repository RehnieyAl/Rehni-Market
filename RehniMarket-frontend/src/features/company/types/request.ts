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
}

export interface ChangeProductStatus {
is_active: boolean;
}
