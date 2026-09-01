import { api } from "@/api/Client";
import type {
  CreateVariantRequest,
  UpdateVariantRequest,
} from "@/features/company/types/request";
import type {
  GeneratedCombination,
  VariantResponse,
  VariantDetailResponse,
} from "@/features/company/types/response";
import type { AttributeValueInput } from "@/features/company/types/catalogAttributes";

export async function getProductVariants(productId: string, includeDeleted = false) {
  const { data } = await api.get<VariantResponse[]>(
    `/company/dashboard/products/${productId}/variants`,
    { params: { include_deleted: includeDeleted } },
  );
  return data;
}

export async function getVariantDetail(productId: string, variantId: string) {
  const { data } = await api.get<VariantDetailResponse>(
    `/company/dashboard/products/${productId}/variants/${variantId}`,
  );
  return data;
}

export async function createVariant(productId: string, variant: CreateVariantRequest) {
  const { data } = await api.post<VariantDetailResponse>(
    `/company/dashboard/products/${productId}/variants`,
    variant,
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

export async function deleteVariant(productId: string, variantId: string) {
  const { data } = await api.delete(
    `/company/dashboard/products/${productId}/variants/${variantId}`,
  );
  return data;
}

export async function generateCombinations(
  productId: string,
  attributeIds: string[],
): Promise<GeneratedCombination[]> {
  const { data } = await api.post<GeneratedCombination[]>(
    `/company/dashboard/products/${productId}/variants/generate`,
    { attribute_ids: attributeIds },
  );
  return data;
}

export async function setVariantAttributeValues(
  productId: string,
  variantId: string,
  values: AttributeValueInput[],
) {
  const { data } = await api.put<VariantDetailResponse>(
    `/company/dashboard/products/${productId}/variants/${variantId}/attribute-values`,
    values.map((item) => ({ attribute_id: item.attributeId, value: item.value })),
  );
  return data;
}

export async function uploadVariantImages(
  productId: string,
  variantId: string,
  files: File[],
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("imagesVariant", file));

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
