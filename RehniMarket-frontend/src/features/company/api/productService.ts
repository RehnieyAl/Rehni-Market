import { api } from "@/api/Client";
import type {
  CreateProductRequest,
  ChangeProductStatus,
  UpdateProductRequest,
} from "@/features/company/types/request";
import type { ProductDetailResponse } from "@/features/company/types/response";
import type { AttributeValueInput } from "@/features/company/types/catalogAttributes";

interface CreateProductResult {
  product_id: string;
  name: string;
  catalog: string;
}

// El backend resuelve technicalSpecProduct como JSON [{attributeId, value}] contra los
// atributos role="product" del catálogo.
function serializeAttributes(values: AttributeValueInput[]): string {
  return JSON.stringify(
    values
      .filter((item) => item.value.trim() !== "")
      .map((item) => ({ attributeId: item.attributeId, value: item.value.trim() })),
  );
}

export async function createProduct(
  product: CreateProductRequest,
): Promise<CreateProductResult> {
  const formData = new FormData();

  formData.append("nameProduct", product.nameProduct);
  formData.append("catalogId", product.catalogId);
  formData.append("descripcionProduct", product.descripcionProduct);
  formData.append("technicalSpecProduct", serializeAttributes(product.productAttributes));
  // Datos comerciales (precio, stock, imágenes) viven en las variantes.
  formData.append("priceProduct", "0");
  formData.append("stockProduct", "0");

  const { data } = await api.post<CreateProductResult>(
    "/company/dashboard/create-product",
    formData,
  );
  return data;
}

export async function getMyProducts(page = 1, limit = 10, search = "") {
  const { data } = await api.get("/company/dashboard/get-my-products", {
    params: { page, limit, search },
  });
  return data;
}

export async function changeProductStatus(productId: string, data: ChangeProductStatus) {
  const { data: response } = await api.patch(
    `/company/dashboard/change-status-my-product/${productId}`,
    data,
  );
  return response;
}

export async function deleteMyProduct(productId: string) {
  const { data } = await api.delete(`/company/dashboard/delete-my-product/${productId}`);
  return data;
}

export async function getProductDetail(productId: string) {
  const { data } = await api.get<ProductDetailResponse>(
    `/company/dashboard/get-my-product/${productId}`,
  );
  return data;
}

export async function updateProduct(productId: string, patch: UpdateProductRequest) {
  const formData = new FormData();

  if (patch.nameProduct !== undefined) formData.append("nameProduct", patch.nameProduct);
  if (patch.catalogId !== undefined) formData.append("catalogId", patch.catalogId);
  if (patch.descripcionProduct !== undefined) {
    formData.append("descripcionProduct", patch.descripcionProduct);
  }
  if (patch.productAttributes !== undefined) {
    formData.append("technicalSpecProduct", serializeAttributes(patch.productAttributes));
  }

  const { data } = await api.patch(
    `/company/dashboard/update-my-product/${productId}`,
    formData,
  );
  return data;
}
