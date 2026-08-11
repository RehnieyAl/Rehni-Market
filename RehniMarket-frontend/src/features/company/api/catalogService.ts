import { api } from "@/api/Client";
import type {
CatalogResponse,
SpecificationResponse,
} from "../types/response";

export async function getCatalogs() {
const { data } = await api.get<CatalogResponse[]>(
"/public/catalogs",
);

return data;
}

export async function getCatalogSpecifications(
catalogId: string,
) {
const { data } = await api.get<SpecificationResponse[]>(
`/public/catalogs/${catalogId}/specifications`,
);

return data;
}
