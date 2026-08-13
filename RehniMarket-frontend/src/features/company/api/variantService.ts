import { api } from "@/api/Client";
import type {
CreateVariantRequest,
UpdateVariantRequest,
VariantSpecificationRequest,
VariantSpecificationUpdateRequest,
} from "@/features/company/types/request";
import type {
VariantResponse,
VariantDetailResponse,
} from "@/features/company/types/response";

export async function getProductVariants(productId: string) {
const { data } = await api.get<VariantResponse[]>(
`/company/dashboard/products/${productId}/variants`,
);

return data;
}

export async function getVariantDetail(
productId: string,
variantId: string,
) {
const { data } = await api.get<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}`,
);

return data;
}

export async function createVariant(
productId: string,
variant: CreateVariantRequest,
) {
const formData = new FormData();

formData.append("name", variant.name);
formData.append("price", variant.price.toString());
formData.append("stock", variant.stock.toString());
formData.append("colorId", variant.colorId);
formData.append(
"specifications",
JSON.stringify(variant.specifications),
);

variant.images.forEach((image) => {
formData.append("imagesVariant", image.file);
});

const { data } = await api.post<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants`,
formData,
);

return data;
}

export async function updateVariant(
productId: string,
variantId: string,
patch: UpdateVariantRequest,
) {
const { data } = await api.patch<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}`,
patch,
);

return data;
}

export async function deleteVariant(
productId: string,
variantId: string,
) {
const { data } = await api.delete(
`/company/dashboard/products/${productId}/variants/${variantId}`,
);

return data;
}

export async function uploadVariantImages(
productId: string,
variantId: string,
files: File[],
) {
const formData = new FormData();

files.forEach((file) => {
formData.append("imagesVariant", file);
});

const { data } = await api.post<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}/images`,
formData,
);

return data;
}

export async function deleteVariantImage(
productId: string,
variantId: string,
imageId: string,
) {
const { data } = await api.delete<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}/images/${imageId}`,
);

return data;
}

export async function setMainVariantImage(
productId: string,
variantId: string,
imageId: string,
) {
const { data } = await api.patch<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}/images/${imageId}/main`,
);

return data;
}

export async function createVariantSpecification(
productId: string,
variantId: string,
specification: VariantSpecificationRequest,
) {
const { data } = await api.post<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}/specifications`,
specification,
);

return data;
}

export async function updateVariantSpecification(
productId: string,
variantId: string,
specificationId: string,
patch: VariantSpecificationUpdateRequest,
) {
const { data } = await api.patch<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}/specifications/${specificationId}`,
patch,
);

return data;
}

export async function deleteVariantSpecification(
productId: string,
variantId: string,
specificationId: string,
) {
const { data } = await api.delete<VariantDetailResponse>(
`/company/dashboard/products/${productId}/variants/${variantId}/specifications/${specificationId}`,
);

return data;
}
