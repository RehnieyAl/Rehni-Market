import { api } from "@/api/Client";
import type {
CreateProductRequest,
ChangeProductStatus,
} from "@/features/company/types/request";

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
