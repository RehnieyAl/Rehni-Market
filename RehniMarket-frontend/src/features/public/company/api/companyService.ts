import { api } from "@/api/Client";

import type {
  PublicCompanyProfile,
  PublicCompanyProductsResponse,
  CompanyRating,
} from "../types/response";

export async function getPublicCompanyProfile(
  companyId: string,
): Promise<PublicCompanyProfile> {
  const { data } = await api.get<PublicCompanyProfile>(`/public/company/${companyId}`);

  return data;
}

export async function getCompanyRating(companyId: string): Promise<CompanyRating> {
  const { data } = await api.get<CompanyRating>(`/public/company/${companyId}/rating`);

  return data;
}

export async function getPublicCompanyProducts(
  companyId: string,
  page = 1,
  limit = 12,
): Promise<PublicCompanyProductsResponse> {
  const { data } = await api.get<PublicCompanyProductsResponse>(
    `/public/company/${companyId}/products`,
    { params: { page, limit } },
  );

  return data;
}
