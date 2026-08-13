import { api } from "@/api/Client";
import type {
CreateProductRequest,
ChangeProductStatus,
UpdateProductRequest,
} from "@/features/company/types/request";
import type { ProductDetailResponse } from "@/features/company/types/response";

export async function createProduct(
product: CreateProductRequest,
) {
const formData = new FormData();

formData.append("nameProduct", product.nameProduct);
formData.append("catalogId", product.catalogId);
formData.append(
"priceProduct",
product.priceProduct.toString(),
);
formData.append(
"stockProduct",
product.stockProduct.toString(),
);
formData.append(
"descripcionProduct",
product.descripcionProduct,
);

formData.append(
"technicalSpecProduct",
JSON.stringify(product.technicalSpecProduct),
);

if (product.mainColorId) {
formData.append("mainColorId", product.mainColorId);
}

product.imagesProduct.forEach((image) => {
formData.append("imagesProduct", image.file);
});

formData.append(
"mainImageIndex",
product.imagesProduct
.findIndex((image) => image.isMain)
.toString(),
);

const { data } = await api.post(
"/company/dashboard/create-product",
formData,
);

return data;
}

export async function getMyProducts(
page: number = 1,
limit: number = 10,
search: string = "",
) {
const { data } = await api.get(
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
data: ChangeProductStatus,
) {
const { data: response } = await api.patch(
`/company/dashboard/change-status-my-product/${productId}`,
data,
);

return response;
}

export async function deleteMyProduct(
productId: string,
) {
const { data } = await api.delete(
`/company/dashboard/delete-my-product/${productId}`,
);

return data;
}

export async function getProductDetail(
productId: string,
) {
const { data } = await api.get<ProductDetailResponse>(
`/company/dashboard/get-my-product/${productId}`,
);

return data;
}

export async function updateProduct(
productId: string,
patch: UpdateProductRequest,
) {
const formData = new FormData();

if (patch.nameProduct !== undefined) {
formData.append("nameProduct", patch.nameProduct);
}

if (patch.catalogId !== undefined) {
formData.append("catalogId", patch.catalogId);
}

if (patch.priceProduct !== undefined) {
formData.append("priceProduct", patch.priceProduct.toString());
}

if (patch.discountEnable !== undefined) {
formData.append("discountEnable", patch.discountEnable.toString());
}

if (patch.discountValue !== undefined) {
formData.append("discountValue", patch.discountValue.toString());
}

if (patch.stockProduct !== undefined) {
formData.append("stockProduct", patch.stockProduct.toString());
}

if (patch.descripcionProduct !== undefined) {
formData.append("descripcionProduct", patch.descripcionProduct);
}

if (patch.clearMainColor) {
formData.append("clearMainColor", "true");
} else if (patch.mainColorId !== undefined) {
formData.append("mainColorId", patch.mainColorId);
}

if (patch.technicalSpecProduct !== undefined) {
formData.append(
"technicalSpecProduct",
JSON.stringify(patch.technicalSpecProduct),
);
}

if (patch.mainImageId !== undefined) {
formData.append("mainImageId", patch.mainImageId);
}

patch.imagesToDeleted?.forEach((imageId) => {
formData.append("imagesToDeleted", imageId);
});

patch.imagesProduct?.forEach((file) => {
formData.append("imagesProduct", file);
});

const { data } = await api.patch(
`/company/dashboard/update-my-product/${productId}`,
formData,
);

return data;
}
