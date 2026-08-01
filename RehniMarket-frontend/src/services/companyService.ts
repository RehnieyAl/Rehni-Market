import { api } from "../api/Client";
import type {
  DashboardHomeResponse,
  CompanyProfileResponse,
  UpdateProfileRequest,
  CompanyMediaUpload,
  CreateProductRequest,
  CatalogResponse,
  SpecificationResponse,
  MyProductsPaginationResponse,
  ChangeProductStatus
} from "../types/company";

export async function getCompanyHero() {
  const { data } = await api.get<DashboardHomeResponse>(
    "/company/dashboard/me",
  );

  return data;
}

export async function getMyCompanyProfile() {
  const { data } = await api.get<CompanyProfileResponse>(
    "/company/dashboard/my-profile",
  );

  return data;
}

export async function updateMyCompanyProfile(
  dataProfile: UpdateProfileRequest,
) {
  const { data } = await api.patch(
    "/company/dashboard/upgrade-my-profile",
    dataProfile,
  );

  return data;
}

export async function patchMediaLogoBanner(media: CompanyMediaUpload) {
  const formData = new FormData();

  if (media.photo_profile) {
    formData.append("photo_profile", media.photo_profile);
  }

  if (media.banner_profile) {
    formData.append("banner_profile", media.banner_profile);
  }

  const { data } = await api.patch(
    "/company/dashboard/patch-media-logo-banner",
    formData,
  );

  return data;
}

export async function createProduct(product: CreateProductRequest) {
  const formData = new FormData();

  formData.append("nameProduct", product.nameProduct);
  formData.append("catalogId", product.catalogId);
  formData.append("priceProduct", product.priceProduct.toString());
  formData.append("stockProduct", product.stockProduct.toString());
  formData.append("descripcionProduct", product.descripcionProduct);

  formData.append(
    "technicalSpecProduct",
    JSON.stringify(product.technicalSpecProduct),
  );

  product.imagesProduct.forEach((image) => {
    formData.append("imagesProduct", image.file);
  });

  formData.append(
    "mainImageIndex",
    product.imagesProduct.findIndex((image) => image.isMain).toString(),
  );

  const { data } = await api.post(
    "/company/dashboard/create-product",
    formData,
  );

  return data;
}

export async function getCatalogs() {
  const { data } = await api.get<CatalogResponse[]>("/public/catalogs");

  return data;
}

export async function getCatalogSpecifications(catalogId: string) {
  const { data } = await api.get<SpecificationResponse[]>(
    `/public/catalogs/${catalogId}/specifications`,
  );

  return data;
}




export async function getMyProducts(page: number = 1,limit: number = 10,search: string = "",) {
  const { data } = await api.get<MyProductsPaginationResponse>(
    "/company/dashboard/get-my-products",
    {
      params: {
        page,
        limit,
        search,
      },
    },
  );

  return data;
}

export async function changeProductStatus(
  productId: string,
  data: ChangeProductStatus
) {
  const { data: response } = await api.patch(
    `/company/dashboard/change-status-my-product/${productId}`,
    data,
  );

  return response;
}

export async function deleteMyProduct(
  productId: string
) {
  const { data } = await api.delete(
    `/company/dashboard/delete-my-product/${productId}`
  );

  return data;
}